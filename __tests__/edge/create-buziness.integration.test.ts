/**
 * create-buziness against a running Supabase stack.
 *
 * Everything up to the OpenAI call — auth, title normalisation, ownership and
 * the contact requirement — is exercised without a key. The two tests that
 * write a row need OPENAI_API_KEY, because the embedding is generated before
 * the insert. The opt-out suite needs no key either: with the AI setting off
 * there is no call to make.
 */
import {
  adminClient,
  anonClient,
  edgeStack,
  invokeFunction,
  readBody,
} from "@/test-utils/edge/clients";
import { TestData, TEST_MARKER } from "@/test-utils/edge/fixtures";
import { describeWithOpenAI } from "@/test-utils/edge/gates";
import { createClient } from "@supabase/supabase-js";

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
    // Opted in: without this the function skips OpenAI entirely and there is no
    // embedding to assert on. See "the AI setting" below for that case.
    const user = await data.createUser({ aiEnhance: true });
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
    const user = await data.createUser({ aiEnhance: true });
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

/**
 * No OPENAI_API_KEY gate here on purpose: with the setting off the function
 * must not call OpenAI at all, so these pass with no key configured — which is
 * itself part of what they prove.
 */
describe("create-buziness: the AI setting", () => {
  it("saves the row without an embedding when the author opted out", async () => {
    const user = await data.createUser({ aiEnhance: false });
    await data.createContact(user.id);

    const res = await invokeFunction("create-buziness", {
      token: user.accessToken,
      body: {
        title: `${TEST_MARKER}festő`,
        description: "Szobafestés, mázolás",
      },
    });

    expect(res.status).toBe(200);
    const created = (await readBody(res)) as Record<string, unknown>;
    data.trackBuziness(created.id as number);

    const { data: row } = await admin
      .from("buziness")
      .select("embedding, embedding_text")
      .eq("id", created.id as number)
      .single();
    expect(row?.embedding).toBeNull();
    expect(row?.embedding_text).toBeNull();
  });

  it("clears an existing embedding when the author saves after opting out", async () => {
    const user = await data.createUser({ aiEnhance: false });
    await data.createContact(user.id);
    // Seeded with embedding text, as a row created back when the setting was on.
    const existing = await data.seedBuziness(user.id, {
      embedding_text: "korábbi kulcsszavak",
    });

    const res = await invokeFunction("create-buziness", {
      token: user.accessToken,
      body: {
        id: existing.id,
        title: `${TEST_MARKER}festő`,
        description: "Szobafestés, mázolás",
      },
    });

    expect(res.status).toBe(200);
    const { data: row } = await admin
      .from("buziness")
      .select("embedding, embedding_text")
      .eq("id", existing.id)
      .single();
    expect(row?.embedding).toBeNull();
    expect(row?.embedding_text).toBeNull();
  });
});

/**
 * The "public" flag: whether a biznisz can be opened with a link by somebody
 * who is not signed in. The flag itself is written by the edge function; what
 * it *means* is the SELECT policy, which is what the second suite checks — the
 * anon key is exactly what a stranger's browser (and the link-preview edge
 * function) holds.
 */
describe("create-buziness: the public flag", () => {
  it("defaults to private", async () => {
    const user = await data.createUser({ aiEnhance: false });
    await data.createContact(user.id);

    const res = await invokeFunction("create-buziness", {
      token: user.accessToken,
      body: { title: `${TEST_MARKER}asztalos`, description: "Bútorkészítés" },
    });

    expect(res.status).toBe(200);
    const created = (await readBody(res)) as Record<string, unknown>;
    data.trackBuziness(created.id as number);

    expect(created.public).toBe(false);
  });

  it("saves the author's choice, and lets them take it back", async () => {
    const user = await data.createUser({ aiEnhance: false });
    await data.createContact(user.id);

    const shared = await invokeFunction("create-buziness", {
      token: user.accessToken,
      body: {
        title: `${TEST_MARKER}kőműves`,
        description: "Falazás, vakolás",
        public: true,
      },
    });
    const created = (await readBody(shared)) as Record<string, unknown>;
    data.trackBuziness(created.id as number);
    expect(created.public).toBe(true);

    const withdrawn = await invokeFunction("create-buziness", {
      token: user.accessToken,
      body: {
        id: created.id,
        title: `${TEST_MARKER}kőműves`,
        description: "Falazás, vakolás",
        public: false,
      },
    });

    expect(withdrawn.status).toBe(200);
    expect((await readBody(withdrawn)) as Record<string, unknown>).toMatchObject({
      public: false,
    });
  });
});

describe("buziness: what a signed-out visitor can read", () => {
  const anon = anonClient();

  it("serves a public biznisz to a link with no account behind it", async () => {
    const user = await data.createUser();
    const buziness = await data.seedBuziness(user.id, { public: true });

    const { data: row } = await anon
      .from("buziness")
      .select("id, title, description, images")
      .eq("id", buziness.id)
      .maybeSingle();

    expect(row).toMatchObject({ id: buziness.id, title: buziness.title });
  });

  it("hides a private one — the page has nothing to show a stranger", async () => {
    const user = await data.createUser();
    const buziness = await data.seedBuziness(user.id);

    const { data: row, error } = await anon
      .from("buziness")
      .select("id, title")
      .eq("id", buziness.id)
      .maybeSingle();

    expect(error).toBeNull();
    expect(row).toBeNull();
  });

  it("still shows a private one to a signed-in member", async () => {
    const owner = await data.createUser();
    const reader = await data.createUser();
    const buziness = await data.seedBuziness(owner.id);

    const { url, anonKey } = edgeStack();
    const memberClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${reader.accessToken}` } },
    });

    const { data: row } = await memberClient
      .from("buziness")
      .select("id, title")
      .eq("id", buziness.id)
      .maybeSingle();

    expect(row).toMatchObject({ id: buziness.id });
  });
});
