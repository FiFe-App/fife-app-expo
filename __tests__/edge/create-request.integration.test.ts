/**
 * create-request against a running Supabase stack.
 *
 * Everything that does not need OpenAI — auth, validation, the author coming from the JWT, the
 * open-requests limit and the AI setting being off — runs without a key. The embedding itself
 * (the AI on) needs OPENAI_API_KEY and is gated. Requests of a test user go away with the user
 * (requests.author cascades), so there is nothing extra to clean up.
 */
import { adminClient, edgeStack, invokeFunction, readBody } from "@/test-utils/edge/clients";
import { TestData, TEST_MARKER } from "@/test-utils/edge/fixtures";
import { describeWithOpenAI } from "@/test-utils/edge/gates";
import { createClient } from "@supabase/supabase-js";

const data = new TestData();
const admin = adminClient();

afterAll(async () => {
  await data.cleanup();
});

describe("create-request: authentication", () => {
  it("rejects a request with no bearer token", async () => {
    const res = await invokeFunction("create-request", { body: { title: "Kertészt keresek" } });

    expect(res.status).toBe(401);
  });

  it("rejects the public anon key — it authenticates no one", async () => {
    const res = await invokeFunction("create-request", {
      token: edgeStack().anonKey,
      body: { title: "Kertészt keresek" },
    });

    expect(res.status).toBe(401);
  });
});

describe("create-request: validation", () => {
  let token: string;

  beforeAll(async () => {
    token = (await data.createUser()).accessToken;
  });

  const create = (body: unknown) => invokeFunction("create-request", { token, body });

  it.each([
    ["no title", {}],
    ["a title that is not a string", { title: 42 }],
    ["a title that is too short", { title: "ab" }],
    ["a title that is too long", { title: "x".repeat(121) }],
    ["a description that is too long", { title: "Kertészt keresek", description: "x".repeat(2001) }],
    ["tags that are not strings", { title: "Kertészt keresek", tags: [1, 2] }],
    ["more than ten tags", { title: "Kertészt keresek", tags: Array.from({ length: 11 }, (_, i) => `t${i}`) }],
    ["a location that is not a point", { title: "Kertészt keresek", location: "Budapest" }],
    ["a location out of range", { title: "Kertészt keresek", location: "POINT(200 47)" }],
    ["a radius out of range", { title: "Kertészt keresek", location: "POINT(19 47)", radius: 5 }],
  ])("refuses %s", async (_name, body) => {
    const res = await create(body);

    expect(res.status).toBe(400);
  });
});

describe("create-request: writing rows (AI off)", () => {
  it("creates the row for the caller, with no embedding, and ignores what the body must not set", async () => {
    const user = await data.createUser({ aiEnhance: false });
    const other = await data.createUser();

    const res = await invokeFunction("create-request", {
      token: user.accessToken,
      body: {
        title: `  ${TEST_MARKER}Kertészt keresek  `,
        description: "Fűnyírás",
        tags: ["kertészet", " Kertészet ", "sövény", ""],
        location: "POINT(19.09 47.56)",
        radius: 3000,
        // None of these may reach the row: the author is the caller, the rest is server-side.
        author: other.id,
        status: "solved",
        embedding: Array.from({ length: 512 }, () => 1),
      },
    });

    expect(res.status).toBe(200);
    const { id } = (await readBody(res)) as { id: number };

    const { data: row } = await admin.from("requests").select("*").eq("id", id).single();
    expect(row).toMatchObject({
      author: user.id,
      title: `${TEST_MARKER}Kertészt keresek`,
      description: "Fűnyírás",
      tags: ["kertészet", "sövény"],
      radius: 3000,
      status: "open",
      embedding: null,
      embedding_text: null,
    });
  });

  it("saves a request with no place as Bárhol", async () => {
    const user = await data.createUser({ aiEnhance: false });

    const res = await invokeFunction("create-request", {
      token: user.accessToken,
      body: { title: `${TEST_MARKER}online segítség` },
    });

    const { id } = (await readBody(res)) as { id: number };
    const { data: row } = await admin.from("requests").select("location, radius").eq("id", id).single();
    expect(row).toEqual({ location: null, radius: null });
  });

  it("refuses the eleventh open request with the message written for the user", async () => {
    const user = await data.createUser({ aiEnhance: false });
    await admin.from("requests").insert(
      Array.from({ length: 10 }, (_, i) => ({ author: user.id, title: `${TEST_MARKER}kérés ${i}` })),
    );

    const res = await invokeFunction("create-request", {
      token: user.accessToken,
      body: { title: `${TEST_MARKER}tizenegyedik` },
    });

    expect(res.status).toBe(400);
    expect(await readBody(res)).toMatchObject({
      error: expect.stringContaining("nyitott kérésed"),
    });
  });
});

describe("requests: the client cannot write what only the server may", () => {
  it("has no INSERT, and cannot touch the embedding or the text of a row", async () => {
    const user = await data.createUser({ aiEnhance: false });
    const { id } = (await readBody(
      await invokeFunction("create-request", {
        token: user.accessToken,
        body: { title: `${TEST_MARKER}saját kérés` },
      }),
    )) as { id: number };

    const client = createClient(edgeStack().url, edgeStack().anonKey, {
      global: { headers: { Authorization: `Bearer ${user.accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const insert = await client.from("requests").insert({ author: user.id, title: "direkt" });
    expect(insert.error).not.toBeNull();

    const forged = await client
      .from("requests")
      .update({ embedding: Array.from({ length: 512 }, () => 1) })
      .eq("id", id);
    expect(forged.error).not.toBeNull();

    const retitled = await client.from("requests").update({ title: "átírva" }).eq("id", id);
    expect(retitled.error).not.toBeNull();

    // Marking it solved is what the client is for.
    const solved = await client.from("requests").update({ status: "solved" }).eq("id", id);
    expect(solved.error).toBeNull();
  });
});

describeWithOpenAI("create-request: the embedding (AI on)", () => {
  it("stores a keyword expansion and a 512-dimension vector", async () => {
    const user = await data.createUser({ aiEnhance: true });

    const res = await invokeFunction("create-request", {
      token: user.accessToken,
      body: {
        title: `${TEST_MARKER}Kertészt keresek`,
        tags: ["kertészet"],
        description: "Fűnyírás és sövényvágás",
      },
    });

    expect(res.status).toBe(200);
    const { id } = (await readBody(res)) as { id: number };
    const { data: row } = await admin
      .from("requests")
      .select("embedding_text, embedding")
      .eq("id", id)
      .single();
    expect(row?.embedding_text).toBeTruthy();
    const stored = typeof row?.embedding === "string" ? JSON.parse(row.embedding) : row?.embedding;
    expect(stored).toHaveLength(512);
  }, 60_000);

  it("clears the embedding when the author turns the AI off", async () => {
    const user = await data.createUser({ aiEnhance: true });
    const { id } = (await readBody(
      await invokeFunction("create-request", {
        token: user.accessToken,
        body: { title: `${TEST_MARKER}Kertészt keresek` },
      }),
    )) as { id: number };

    await admin.from("user_settings").update({ ai_enhance: false }).eq("author", user.id);

    const { data: row } = await admin
      .from("requests")
      .select("embedding_text, embedding")
      .eq("id", id)
      .single();
    expect(row).toEqual({ embedding_text: null, embedding: null });
  }, 60_000);
});
