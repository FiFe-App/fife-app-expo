/**
 * create-buziness against a running Supabase stack.
 *
 * Everything up to the OpenAI call — auth, title normalisation, ownership and
 * the contact requirement — is exercised without a key. The two tests that
 * write a row need OPENAI_API_KEY, because the embedding is generated before
 * the insert.
 */
import { adminClient, edgeStack, invokeFunction, readBody } from "@/test-utils/edge/clients";
import { TestData, TEST_MARKER } from "@/test-utils/edge/fixtures";
import { describeWithOpenAI } from "@/test-utils/edge/gates";

const data = new TestData();
const admin = adminClient();

afterAll(async () => {
  await data.cleanup();
});

describe("create-buziness: authentication", () => {
  it("rejects a request with no bearer token", async () => {
    const res = await invokeFunction("create-buziness", { body: { title: "x" } });

    expect(res.status).toBe(401);
  });

  it("rejects the public anon key — it authenticates no one", async () => {
    const res = await invokeFunction("create-buziness", {
      token: edgeStack().anonKey,
      body: { title: "x" },
    });

    expect(res.status).toBe(401);
    expect(await readBody(res)).toMatchObject({ error: "Unauthorized" });
  });
});

describe("create-buziness: validation", () => {
  let token: string;

  beforeAll(async () => {
    const user = await data.createUser();
    await data.createContact(user.id);
    token = user.accessToken;
  });

  it("refuses a title that is not a string", async () => {
    const res = await invokeFunction("create-buziness", { token, body: { title: 42 } });

    expect(res.status).toBe(400);
    expect(await readBody(res)).toMatchObject({ error: "Title must be a non-empty string" });
  });

  it("refuses a title that normalises away to nothing", async () => {
    const res = await invokeFunction("create-buziness", { token, body: { title: " $  $ " } });

    expect(res.status).toBe(400);
    expect(await readBody(res)).toMatchObject({
      error: "Title cannot be empty after normalization",
    });
  });
});

describe("create-buziness: authorisation", () => {
  it("refuses a caller with no contact", async () => {
    const user = await data.createUser();

    const res = await invokeFunction("create-buziness", {
      token: user.accessToken,
      body: { title: `${TEST_MARKER}no-contact`, description: "x" },
    });

    expect(res.status).toBe(400);
    expect(await readBody(res)).toMatchObject({
      error: "At least one contact is required to create a buziness",
    });
  });

  it("will not let one user overwrite another user's buziness", async () => {
    const owner = await data.createUser();
    const attacker = await data.createUser();
    await data.createContact(attacker.id);
    const victim = await data.seedBuziness(owner.id);

    const res = await invokeFunction("create-buziness", {
      token: attacker.accessToken,
      body: { id: victim.id, title: `${TEST_MARKER}hijacked` },
    });

    // 404 rather than 403: the response must not reveal which ids exist.
    expect(res.status).toBe(404);
    expect(await readBody(res)).toMatchObject({ error: "Not found" });

    const { data: row } = await admin
      .from("buziness")
      .select("title, author")
      .eq("id", victim.id)
      .single();
    expect(row).toMatchObject({ title: victim.title, author: owner.id });
  });
});

describeWithOpenAI("create-buziness: writing rows", () => {
  it("creates the row for the caller, normalising the title", async () => {
    const user = await data.createUser();
    await data.createContact(user.id);
    const other = await data.createUser();

    const res = await invokeFunction("create-buziness", {
      token: user.accessToken,
      body: {
        title: `${TEST_MARKER}kertész $  $ metszés`,
        description: "Fák és bokrok metszése",
        // Both of these must be ignored: the author comes from the JWT and the
        // embedding is what drives search ranking.
        author: other.id,
        embedding: Array.from({ length: 512 }, () => 1),
      },
    });

    expect(res.status).toBe(200);
    const created = (await readBody(res)) as Record<string, unknown>;
    data.trackBuziness(created.id as number);

    expect(created.author).toBe(user.id);
    expect(created.title).toBe(`${TEST_MARKER}kertész $ metszés`);

    const { data: row } = await admin
      .from("buziness")
      .select("author, title, embedding_text, embedding")
      .eq("id", created.id as number)
      .single();
    expect(row?.author).toBe(user.id);
    // Generated server-side from the title, not taken from the request body.
    expect(row?.embedding_text).toBeTruthy();
    // pgvector comes back as "[0.1,…]" over PostgREST.
    const stored =
      typeof row?.embedding === "string" ? JSON.parse(row.embedding) : row?.embedding;
    expect(stored).toHaveLength(512);
    expect(stored).not.toEqual(Array.from({ length: 512 }, () => 1));
  }, 60_000);

  it("updates the caller's own row in place", async () => {
    const user = await data.createUser();
    await data.createContact(user.id);
    const existing = await data.seedBuziness(user.id);

    const res = await invokeFunction("create-buziness", {
      token: user.accessToken,
      body: {
        id: existing.id,
        title: `${TEST_MARKER}updated`,
        description: "Frissített leírás",
      },
    });

    expect(res.status).toBe(200);
    const updated = (await readBody(res)) as Record<string, unknown>;
    expect(updated.id).toBe(existing.id);
    expect(updated.title).toBe(`${TEST_MARKER}updated`);
  }, 60_000);
});
