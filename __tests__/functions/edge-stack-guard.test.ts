/**
 * The edge-function integration suite deletes what it creates, so where it is
 * allowed to point is a safety property, not a convenience. This runs in the
 * normal (hermetic) suite — no stack required.
 */
type StackModule = typeof import("@/test-utils/edge/stack");

const EDGE_KEYS = [
  "EDGE_TEST_SUPABASE_URL",
  "EDGE_TEST_ANON_KEY",
  "EDGE_TEST_SERVICE_ROLE_KEY",
  "EDGE_TEST_ALLOW_REMOTE",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEWSLETTER_SECRET",
  "OPENAI_API_KEY",
];

const original: Record<string, string | undefined> = {};

/** Fresh module each time: the CLI lookup inside memoises per module instance. */
const loadStack = (): StackModule => {
  let mod!: StackModule;
  jest.isolateModules(() => {
    mod = require("@/test-utils/edge/stack");
  });
  return mod;
};

beforeEach(() => {
  for (const key of EDGE_KEYS) {
    original[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of EDGE_KEYS) {
    if (original[key] === undefined) delete process.env[key];
    else process.env[key] = original[key];
  }
});

describe("assertSafeTarget", () => {
  it("accepts a local stack", () => {
    const { assertSafeTarget } = loadStack();

    expect(() => assertSafeTarget("http://127.0.0.1:54321")).not.toThrow();
    expect(() => assertSafeTarget("http://localhost:54321")).not.toThrow();
  });

  it("refuses a remote project unless the run says so out loud", () => {
    const { assertSafeTarget } = loadStack();

    expect(() => assertSafeTarget("https://staging.supabase.co")).toThrow(
      /not a local Supabase stack/,
    );

    process.env.EDGE_TEST_ALLOW_REMOTE = "1";
    expect(() => assertSafeTarget("https://staging.supabase.co")).not.toThrow();
  });

  it("refuses the production project even with the remote override set", () => {
    const { assertSafeTarget } = loadStack();
    process.env.EDGE_TEST_ALLOW_REMOTE = "1";

    expect(() => assertSafeTarget("https://pdzuvfkkrhtrrrcckwzj.supabase.co")).toThrow(
      /production project/,
    );
  });

  it("refuses something that isn't a URL at all", () => {
    const { assertSafeTarget } = loadStack();

    expect(() => assertSafeTarget("not-a-url")).toThrow(/not a valid URL/);
  });
});

describe("resolveStack", () => {
  const setLocalKeys = () => {
    process.env.EDGE_TEST_SUPABASE_URL = "http://127.0.0.1:54321";
    process.env.EDGE_TEST_ANON_KEY = "anon-key";
    process.env.EDGE_TEST_SERVICE_ROLE_KEY = "service-key";
  };

  it("prefers the EDGE_TEST_* overrides over the ambient SUPABASE_* ones", () => {
    setLocalKeys();
    process.env.SUPABASE_URL = "https://pdzuvfkkrhtrrrcckwzj.supabase.co";
    process.env.SUPABASE_ANON_KEY = "ambient-anon";

    const stack = loadStack().resolveStack();

    expect(stack.url).toBe("http://127.0.0.1:54321");
    expect(stack.anonKey).toBe("anon-key");
  });

  it("signs unsubscribe tokens with the service role key when no secret is set", () => {
    setLocalKeys();

    expect(loadStack().resolveStack().newsletterSecret).toBe("service-key");

    process.env.NEWSLETTER_SECRET = "explicit-secret";
    expect(loadStack().resolveStack().newsletterSecret).toBe("explicit-secret");
  });

  it("reports missing keys with the command that provides them", () => {
    process.env.EDGE_TEST_SUPABASE_URL = "http://127.0.0.1:54321";
    process.env.EDGE_TEST_ANON_KEY = "anon-key";
    // Service role key deliberately absent.

    expect(() => loadStack().resolveStack()).toThrow(/supabase start/);
  });

  it("trims a trailing slash so function URLs don't double up", () => {
    setLocalKeys();
    process.env.EDGE_TEST_SUPABASE_URL = "http://127.0.0.1:54321/";

    expect(loadStack().resolveStack().url).toBe("http://127.0.0.1:54321");
  });
});
