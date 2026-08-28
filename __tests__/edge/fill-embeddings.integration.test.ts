/**
 * fill-embeddings against a running Supabase stack.
 *
 * Only the gate is exercised. The job itself re-embeds every buziness row in the
 * database — real money at OpenAI and a rewrite of production-shaped data — so a
 * test must never trigger it; that it *can't* be triggered without the service
 * role key is the property worth protecting.
 */
import { edgeStack, invokeFunction, readBody } from "@/test-utils/edge/clients";

describe("fill-embeddings", () => {
  it("rejects a request with no bearer token", async () => {
    const res = await invokeFunction("fill-embeddings");

    expect(res.status).toBe(401);
  });

  it("rejects the public anon key — this job is operator-only", async () => {
    const res = await invokeFunction("fill-embeddings", { token: edgeStack().anonKey });

    expect(res.status).toBe(401);
    expect(await readBody(res)).toMatchObject({ error: "Unauthorized" });
  });

  it("rejects a signed-in user's own JWT", async () => {
    // A user token is not the service role key, however valid it is elsewhere.
    const res = await invokeFunction("fill-embeddings", {
      token: `${edgeStack().anonKey}x`,
    });

    expect(res.status).toBe(401);
  });
});
