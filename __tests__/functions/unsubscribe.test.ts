/**
 * `_shared/unsubscribe.ts` is edge-function code: it reads `Deno.env` at module
 * load and signs with WebCrypto. Both exist under Jest once `Deno` is shimmed,
 * so the security-critical part can be covered without a Deno test runner.
 */
type UnsubscribeModule = typeof import("@/supabase/functions/_shared/unsubscribe");

const ENV: Record<string, string> = {
  NEWSLETTER_SECRET: "test-newsletter-secret",
  FUNCTIONS_BASE_URL: "https://edge.test/functions/v1",
};

const loadWithEnv = (env: Record<string, string>): UnsubscribeModule => {
  (globalThis as { Deno?: unknown }).Deno = {
    env: { get: (k: string) => env[k] },
  };
  let mod!: UnsubscribeModule;
  jest.isolateModules(() => {
    mod = require("@/supabase/functions/_shared/unsubscribe");
  });
  return mod;
};

afterEach(() => {
  delete (globalThis as { Deno?: unknown }).Deno;
});

describe("normalizeEmail", () => {
  it("trims and lowercases so one address has one token", () => {
    const { normalizeEmail } = loadWithEnv(ENV);

    expect(normalizeEmail("  Me@Example.COM ")).toBe("me@example.com");
  });
});

describe("unsubscribeToken", () => {
  it("produces a hex SHA-256 HMAC", async () => {
    const { unsubscribeToken } = loadWithEnv(ENV);

    const token = await unsubscribeToken("me@example.com");

    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is stable for the same address", async () => {
    const { unsubscribeToken } = loadWithEnv(ENV);

    expect(await unsubscribeToken("me@example.com")).toBe(
      await unsubscribeToken("me@example.com"),
    );
  });

  it("ignores case and surrounding whitespace", async () => {
    const { unsubscribeToken } = loadWithEnv(ENV);

    expect(await unsubscribeToken("  Me@Example.COM ")).toBe(
      await unsubscribeToken("me@example.com"),
    );
  });

  it("differs between addresses", async () => {
    const { unsubscribeToken } = loadWithEnv(ENV);

    expect(await unsubscribeToken("a@example.com")).not.toBe(
      await unsubscribeToken("b@example.com"),
    );
  });

  it("differs when the signing key differs", async () => {
    const withSecret = loadWithEnv(ENV);
    const first = await withSecret.unsubscribeToken("me@example.com");

    const withOtherSecret = loadWithEnv({ ...ENV, NEWSLETTER_SECRET: "other" });
    const second = await withOtherSecret.unsubscribeToken("me@example.com");

    expect(first).not.toBe(second);
  });

  it("falls back to the service role key when no secret is configured", async () => {
    const mod = loadWithEnv({
      FUNCTIONS_BASE_URL: ENV.FUNCTIONS_BASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    });

    expect(await mod.unsubscribeToken("me@example.com")).toMatch(
      /^[0-9a-f]{64}$/,
    );
  });
});

describe("verifyUnsubscribeToken", () => {
  it("accepts a token it just issued", async () => {
    const { unsubscribeToken, verifyUnsubscribeToken } = loadWithEnv(ENV);

    const token = await unsubscribeToken("me@example.com");

    expect(await verifyUnsubscribeToken("me@example.com", token)).toBe(true);
  });

  it("accepts an uppercase token", async () => {
    const { unsubscribeToken, verifyUnsubscribeToken } = loadWithEnv(ENV);

    const token = await unsubscribeToken("me@example.com");

    expect(
      await verifyUnsubscribeToken("me@example.com", token.toUpperCase()),
    ).toBe(true);
  });

  it("rejects a token issued for a different address", async () => {
    const { unsubscribeToken, verifyUnsubscribeToken } = loadWithEnv(ENV);

    const token = await unsubscribeToken("victim@example.com");

    // Otherwise anyone holding one valid link could unsubscribe anybody.
    expect(await verifyUnsubscribeToken("someone@example.com", token)).toBe(
      false,
    );
  });

  it("rejects a tampered token", async () => {
    const { unsubscribeToken, verifyUnsubscribeToken } = loadWithEnv(ENV);

    const token = await unsubscribeToken("me@example.com");
    const flipped = (token[0] === "a" ? "b" : "a") + token.slice(1);

    expect(await verifyUnsubscribeToken("me@example.com", flipped)).toBe(false);
  });

  it("rejects a truncated token", async () => {
    const { unsubscribeToken, verifyUnsubscribeToken } = loadWithEnv(ENV);

    const token = await unsubscribeToken("me@example.com");

    expect(await verifyUnsubscribeToken("me@example.com", token.slice(0, 32)))
      .toBe(false);
  });

  it("rejects empty input", async () => {
    const { verifyUnsubscribeToken } = loadWithEnv(ENV);

    expect(await verifyUnsubscribeToken("", "abc")).toBe(false);
    expect(await verifyUnsubscribeToken("me@example.com", "")).toBe(false);
  });

  it("rejects everything when no signing key is configured", async () => {
    const withKey = loadWithEnv(ENV);
    const token = await withKey.unsubscribeToken("me@example.com");

    // An unconfigured deployment must fail closed, not accept all tokens.
    const noKey = loadWithEnv({ FUNCTIONS_BASE_URL: ENV.FUNCTIONS_BASE_URL });

    expect(await noKey.verifyUnsubscribeToken("me@example.com", token)).toBe(
      false,
    );
  });

  it("rejects a token signed with a different key", async () => {
    const other = loadWithEnv({ ...ENV, NEWSLETTER_SECRET: "other-secret" });
    const foreign = await other.unsubscribeToken("me@example.com");

    const ours = loadWithEnv(ENV);

    expect(await ours.verifyUnsubscribeToken("me@example.com", foreign)).toBe(
      false,
    );
  });
});

describe("unsubscribeUrl", () => {
  it("builds a link that verifies", async () => {
    const { unsubscribeUrl, verifyUnsubscribeToken } = loadWithEnv(ENV);

    const url = new URL(await unsubscribeUrl("Me@Example.com"));

    expect(url.origin + url.pathname).toBe(
      "https://edge.test/functions/v1/newsletter-unsubscribe",
    );
    expect(url.searchParams.get("email")).toBe("me@example.com");
    expect(
      await verifyUnsubscribeToken(
        url.searchParams.get("email")!,
        url.searchParams.get("token")!,
      ),
    ).toBe(true);
  });

  it("encodes addresses containing a plus tag", async () => {
    const { unsubscribeUrl } = loadWithEnv(ENV);

    const raw = await unsubscribeUrl("me+news@example.com");

    // A bare "+" in a query string decodes to a space and breaks the lookup.
    expect(raw).toContain("me%2Bnews%40example.com");
    expect(new URL(raw).searchParams.get("email")).toBe("me+news@example.com");
  });

  it("does not double up slashes from a trailing-slash base url", async () => {
    const { unsubscribeUrl } = loadWithEnv({
      ...ENV,
      FUNCTIONS_BASE_URL: "https://edge.test/functions/v1///",
    });

    expect(await unsubscribeUrl("me@example.com")).toContain(
      "https://edge.test/functions/v1/newsletter-unsubscribe?",
    );
  });

  it("derives the base url from SUPABASE_URL when not given one", async () => {
    const { unsubscribeUrl } = loadWithEnv({
      NEWSLETTER_SECRET: ENV.NEWSLETTER_SECRET,
      SUPABASE_URL: "https://proj.supabase.co",
    });

    expect(await unsubscribeUrl("me@example.com")).toContain(
      "https://proj.supabase.co/functions/v1/newsletter-unsubscribe?",
    );
  });
});
