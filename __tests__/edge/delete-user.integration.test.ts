/**
 * delete-user against a running Supabase stack. The happy path deletes its own
 * caller, so there is nothing left to clean up afterwards — which is also the
 * assertion.
 */
import { adminClient, edgeStack, invokeFunction, readBody } from "@/test-utils/edge/clients";
import { TestData } from "@/test-utils/edge/fixtures";

const data = new TestData();
const admin = adminClient();

afterAll(async () => {
  await data.cleanup();
});

describe("delete-user", () => {
  it("rejects a request with no bearer token", async () => {
    const res = await invokeFunction("delete-user");

    expect(res.status).toBe(401);
  });

  it("rejects the public anon key", async () => {
    const res = await invokeFunction("delete-user", { token: edgeStack().anonKey });

    expect(res.status).toBe(401);
    expect(await readBody(res)).toMatchObject({ error: "Unauthorized" });
  });

  it("deletes the caller's auth user and profile", async () => {
    const user = await data.createUser();

    const res = await invokeFunction("delete-user", { token: user.accessToken });

    expect(res.status).toBe(200);
    expect(await readBody(res)).toMatchObject({ success: true });

    const { data: authUser } = await admin.auth.admin.getUserById(user.id);
    expect(authUser?.user).toBeFalsy();

    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();
    expect(profile).toBeNull();
  }, 30_000);

  it("takes the caller's rows with it", async () => {
    const user = await data.createUser();
    const contactId = await data.createContact(user.id);
    const buziness = await data.seedBuziness(user.id);

    const res = await invokeFunction("delete-user", { token: user.accessToken });
    expect(res.status).toBe(200);

    const { data: rows } = await admin.from("buziness").select("id").eq("id", buziness.id);
    expect(rows).toEqual([]);
    const { data: contacts } = await admin.from("contacts").select("id").eq("id", contactId);
    expect(contacts).toEqual([]);
  }, 30_000);
});
