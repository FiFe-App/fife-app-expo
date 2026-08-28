/**
 * notify against a running Supabase stack.
 *
 * notify runs with verify_jwt = false (the database webhook posts to it), so the
 * function's own service-role check is the only thing standing between the
 * public anon key and a push notification sent to anyone — that check is what
 * these tests are mostly about.
 *
 * The paths that actually send are deliberately left alone: they need SMTP
 * credentials and Expo's push service, and a test that mails real people is not
 * a test. Every case below ends in one of notify's documented skips.
 */
import { edgeStack, invokeFunction, readBody } from "@/test-utils/edge/clients";
import { TestData, TEST_MARKER } from "@/test-utils/edge/fixtures";

const data = new TestData();

afterAll(async () => {
  await data.cleanup();
});

describe("notify: authentication", () => {
  it("rejects a request with no bearer token", async () => {
    const res = await invokeFunction("notify", { body: { table: "messages", record: {} } });

    expect(res.status).toBe(401);
  });

  it("rejects the public anon key", async () => {
    const res = await invokeFunction("notify", {
      token: edgeStack().anonKey,
      body: { table: "messages", record: { author: "a", to: "b", text: "hi" } },
    });

    expect(res.status).toBe(401);
    expect(await readBody(res)).toMatchObject({ error: "Unauthorized" });
  });
});

describe("notify: payload handling", () => {
  const serviceRole = () => edgeStack().serviceRoleKey;

  it("refuses a payload with no record", async () => {
    const res = await invokeFunction("notify", {
      token: serviceRole(),
      body: { table: "messages" },
    });

    expect(res.status).toBe(400);
    expect(await readBody(res)).toMatchObject({ error: "Invalid payload" });
  });

  it("ignores heart reactions, which are message rows but not messages", async () => {
    const sender = await data.createUser();
    const recipient = await data.createUser();

    const res = await invokeFunction("notify", {
      token: serviceRole(),
      body: {
        table: "messages",
        record: {
          author: sender.id,
          to: recipient.id,
          text: "heart-42",
          created_at: new Date().toISOString(),
        },
      },
    });

    expect(res.status).toBe(200);
    expect(await readBody(res)).toMatchObject({ ok: true });
  }, 30_000);

  it("ignores a message a user sent to themselves", async () => {
    const user = await data.createUser();

    const res = await invokeFunction("notify", {
      token: serviceRole(),
      body: {
        table: "messages",
        record: {
          author: user.id,
          to: user.id,
          text: `${TEST_MARKER}note to self`,
          created_at: new Date().toISOString(),
        },
      },
    });

    expect(res.status).toBe(200);
    expect(await readBody(res)).toMatchObject({ ok: true });
  }, 30_000);

  it("does not notify an owner who recommended their own buziness", async () => {
    const owner = await data.createUser();
    const buziness = await data.seedBuziness(owner.id);

    const res = await invokeFunction("notify", {
      token: serviceRole(),
      body: {
        table: "buzinessRecommendations",
        record: { author: owner.id, buziness_id: buziness.id },
      },
    });

    expect(res.status).toBe(200);
    expect(await readBody(res)).toMatchObject({ ok: true });
  }, 30_000);
});
