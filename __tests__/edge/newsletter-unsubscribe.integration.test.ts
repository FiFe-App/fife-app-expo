/**
 * newsletter-unsubscribe against a running Supabase stack.
 *
 * The link is clicked from an email client with no session (verify_jwt = false),
 * so the HMAC token in the query string is the only thing standing between a
 * stranger and unsubscribing someone else. Tokens are minted here with the same
 * secret and algorithm as `_shared/unsubscribe.ts`.
 *
 * If the valid-token case comes back "invalid", the functions are running with a
 * different NEWSLETTER_SECRET than this process sees — pass the same --env-file.
 */
import { createHmac } from "node:crypto";

import { adminClient, edgeStack, invokeFunction } from "@/test-utils/edge/clients";
import { TestData, TEST_EMAIL_DOMAIN } from "@/test-utils/edge/fixtures";

const data = new TestData();
const admin = adminClient();

const tokenFor = (email: string) =>
  createHmac("sha256", edgeStack().newsletterSecret)
    .update(email.trim().toLowerCase())
    .digest("hex");

afterAll(async () => {
  await data.cleanup();
});

describe("newsletter-unsubscribe", () => {
  it("redirects a bad token to the confirmation page as invalid", async () => {
    const res = await invokeFunction("newsletter-unsubscribe", {
      method: "GET",
      query: { email: `nobody@${TEST_EMAIL_DOMAIN}`, token: "deadbeef" },
    });

    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toContain("status=invalid");
  });

  it("refuses a one-click POST with a bad token", async () => {
    const res = await invokeFunction("newsletter-unsubscribe", {
      query: { email: `nobody@${TEST_EMAIL_DOMAIN}`, token: "deadbeef" },
    });

    expect(res.status).toBe(400);
  });

  it("refuses a token minted for a different address", async () => {
    const user = await data.createUser({ newsletter: true });

    const res = await invokeFunction("newsletter-unsubscribe", {
      method: "GET",
      query: { email: user.email, token: tokenFor("someone-else@example.com") },
    });

    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toContain("status=invalid");

    const { data: profile } = await admin
      .from("profiles")
      .select("newsletter")
      .eq("id", user.id)
      .single();
    expect(profile?.newsletter).toBe(true);
  }, 30_000);

  it("unsubscribes on a valid token and records the suppression", async () => {
    const user = await data.createUser({ newsletter: true });
    data.trackUnsubscribedEmail(user.email);

    const res = await invokeFunction("newsletter-unsubscribe", {
      method: "GET",
      query: { email: user.email, token: tokenFor(user.email) },
    });

    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toContain("status=ok");

    const { data: profile } = await admin
      .from("profiles")
      .select("newsletter")
      .eq("id", user.id)
      .single();
    expect(profile?.newsletter).toBe(false);

    const { data: suppressed } = await admin
      .from("newsletter_unsubscribes")
      .select("email")
      .eq("email", user.email.toLowerCase())
      .maybeSingle();
    expect(suppressed?.email).toBe(user.email.toLowerCase());
  }, 30_000);

  it("answers a one-click POST with a bare 200, as RFC 8058 wants", async () => {
    const user = await data.createUser({ newsletter: true });
    data.trackUnsubscribedEmail(user.email);

    const res = await invokeFunction("newsletter-unsubscribe", {
      query: { email: user.email, token: tokenFor(user.email) },
    });

    expect(res.status).toBe(200);
  }, 30_000);

  it("rejects methods other than GET and POST", async () => {
    const res = await invokeFunction("newsletter-unsubscribe", {
      method: "PUT",
      query: { email: `nobody@${TEST_EMAIL_DOMAIN}`, token: "deadbeef" },
    });

    expect(res.status).toBe(405);
  });
});
