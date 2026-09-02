/**
 * get_newsletter_recipients against a running Supabase stack.
 *
 * This is the function that decides who a newsletter reaches, and until now
 * nothing covered it — which is how issue 19 came to reach six people while
 * looking like a delivery failure. It is tested through the RPC rather than by
 * sending: the resolver is the whole decision, and calling it needs no SMTP and
 * mails nobody.
 *
 * Service role only by design (it returns every user's address), so every call
 * here goes through the admin client.
 */
import { adminClient } from "@/test-utils/edge/clients";
import { TestData } from "@/test-utils/edge/fixtures";

const data = new TestData();
const admin = adminClient();

type Audience = "subscribers" | "all";

async function resolve(
  audience: Audience,
  emails: string[] | null = null,
): Promise<string[]> {
  const { data: rows, error } = await admin.rpc("get_newsletter_recipients", {
    p_emails: emails,
    p_audience: audience,
  });
  if (error) throw new Error(`get_newsletter_recipients failed: ${error.message}`);
  return (rows ?? []).map((row: { email: string }) => row.email);
}

afterAll(async () => {
  await data.cleanup();
});

describe("get_newsletter_recipients", () => {
  it("returns opt-ins and only opt-ins for the subscribers audience", async () => {
    const subscriber = await data.createUser({ newsletter: true });
    const other = await data.createUser({ newsletter: false });

    const list = await resolve("subscribers");

    expect(list).toContain(subscriber.email.toLowerCase());
    expect(list).not.toContain(other.email.toLowerCase());
  });

  it("returns users who never opted in for the all audience", async () => {
    const subscriber = await data.createUser({ newsletter: true });
    const dormant = await data.createUser({ newsletter: false });

    const list = await resolve("all");

    expect(list).toContain(subscriber.email.toLowerCase());
    expect(list).toContain(dormant.email.toLowerCase());
  });

  it("skips unconfirmed addresses in the all audience", async () => {
    const unconfirmed = await data.createUnconfirmedUser();

    const list = await resolve("all");

    expect(list).not.toContain(unconfirmed.email.toLowerCase());
  });

  it("defaults to the subscribers audience when none is given", async () => {
    const dormant = await data.createUser({ newsletter: false });

    // The old one-argument call shape: the deploy pushes migrations before it
    // deploys functions, so for one window the previous notify function calls
    // it exactly like this. It must keep meaning "subscribers".
    const { data: rows, error } = await admin.rpc("get_newsletter_recipients", {
      p_emails: null,
    });
    if (error) throw new Error(`get_newsletter_recipients failed: ${error.message}`);
    const list = (rows ?? []).map((row: { email: string }) => row.email);

    expect(list).not.toContain(dormant.email.toLowerCase());
  });

  it("ignores subscription state for an explicit address list", async () => {
    const dormant = await data.createUser({ newsletter: false });

    const list = await resolve("subscribers", [dormant.email.toUpperCase()]);

    expect(list).toEqual([dormant.email.toLowerCase()]);
  });

  it("suppresses an unsubscribed address in every mode", async () => {
    const user = await data.createUser({ newsletter: true });
    const email = user.email.toLowerCase();

    const { error } = await admin.from("newsletter_unsubscribes").insert({ email });
    if (error) throw new Error(`Could not suppress ${email}: ${error.message}`);
    data.trackUnsubscribedEmail(email);

    expect(await resolve("subscribers")).not.toContain(email);
    expect(await resolve("all")).not.toContain(email);
    // Documented behaviour: an unsubscribed person is not mailed even when
    // named explicitly.
    expect(await resolve("subscribers", [email])).not.toContain(email);
  });
});
