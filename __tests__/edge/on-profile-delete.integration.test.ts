/**
 * on-profile-delete against a running Supabase stack.
 *
 * The user id comes from the webhook body and drives a storage delete, so the
 * service-role check is the only thing stopping anyone with the public anon key
 * from wiping another user's avatars.
 */
import { adminClient, edgeStack, invokeFunction, readBody } from "@/test-utils/edge/clients";
import { TestData, ensureAvatarsBucket } from "@/test-utils/edge/fixtures";

const data = new TestData();
const admin = adminClient();

afterAll(async () => {
  await data.cleanup();
});

describe("on-profile-delete", () => {
  it("rejects a request with no bearer token", async () => {
    const res = await invokeFunction("on-profile-delete", { body: { old_record: { id: "x" } } });

    expect(res.status).toBe(401);
  });

  it("rejects the public anon key", async () => {
    const res = await invokeFunction("on-profile-delete", {
      token: edgeStack().anonKey,
      body: { old_record: { id: "x" } },
    });

    expect(res.status).toBe(401);
    expect(await readBody(res)).toMatchObject({ error: "Unauthorized" });
  });

  it("shrugs off a payload with no user id", async () => {
    const res = await invokeFunction("on-profile-delete", {
      token: edgeStack().serviceRoleKey,
      body: { old_record: null, record: null },
    });

    expect(res.status).toBe(200);
    expect(await readBody(res)).toMatchObject({ ok: true });
  });

  it("removes the deleted user's avatar files", async () => {
    await ensureAvatarsBucket();
    const user = await data.createUser();
    const path = `${user.id}/avatar.png`;
    data.trackStorageObject("avatars", path);

    const { error: uploadError } = await admin.storage
      .from("avatars")
      .upload(path, new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" }), {
        upsert: true,
      });
    expect(uploadError).toBeNull();

    const res = await invokeFunction("on-profile-delete", {
      token: edgeStack().serviceRoleKey,
      body: { old_record: { id: user.id } },
    });

    expect(res.status).toBe(200);
    const { data: remaining } = await admin.storage.from("avatars").list(user.id);
    expect(remaining ?? []).toEqual([]);
  }, 30_000);
});
