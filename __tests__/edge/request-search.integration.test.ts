/**
 * request-search against a running Supabase stack.
 *
 * Without OPENAI_API_KEY everything below the literal half runs: auth, the scopes, the text
 * match, the world / block rules and the interests ordering. The semantic half (the query's
 * vector) is gated.
 */
import { adminClient, edgeStack, invokeFunction, readBody } from "@/test-utils/edge/clients";
import { TestData, TEST_MARKER } from "@/test-utils/edge/fixtures";
import { describeWithOpenAI } from "@/test-utils/edge/gates";

const data = new TestData();
const admin = adminClient();

afterAll(async () => {
  await data.cleanup();
});

type Row = { id: number; title: string; is_interest_match: boolean };

const search = async (token: string, body: Record<string, unknown>) => {
  const res = await invokeFunction("request-search", { token, body });
  return { res, rows: res.ok ? ((await readBody(res)) as Row[]) : [] };
};

describe("request-search: authentication", () => {
  it("rejects a request with no bearer token", async () => {
    const res = await invokeFunction("request-search", { body: { query: "kert" } });

    expect(res.status).toBe(401);
  });

  it("rejects the public anon key", async () => {
    const res = await invokeFunction("request-search", {
      token: edgeStack().anonKey,
      body: { query: "kert" },
    });

    expect(res.status).toBe(401);
  });
});

describe("request-search: literal search and interests", () => {
  let author: { id: string };
  let reader: { id: string; accessToken: string };

  beforeAll(async () => {
    author = await data.createUser({ aiEnhance: false });
    reader = await data.createUser({ aiEnhance: false });
    await admin.from("requests").insert([
      { author: author.id, title: `${TEST_MARKER}Kertészt keresek`, description: "sövényvágás", tags: ["kertészet"] },
      { author: author.id, title: `${TEST_MARKER}Fúrógépet kölcsönkérnék`, description: "hétvégére" },
    ]);
  });

  it("finds a request by a word of its title or description, all words must match", async () => {
    const { rows } = await search(reader.accessToken, { query: `${TEST_MARKER}Kertészt sövény` });

    expect(rows.map((r) => r.title)).toEqual([`${TEST_MARKER}Kertészt keresek`]);
  });

  it("treats wildcard characters as plain text", async () => {
    const { rows } = await search(reader.accessToken, { query: "%" });

    expect(rows).toEqual([]);
  });

  it("puts the requests that fit my interests first in the for_me slice", async () => {
    const { rows } = await search(reader.accessToken, {
      query: "",
      scope: "for_me",
      take: 100,
      interests: ["fúrógép"],
    });

    const ours = rows.filter((r) => r.title.startsWith(TEST_MARKER));
    expect(ours[0]).toMatchObject({
      title: `${TEST_MARKER}Fúrógépet kölcsönkérnék`,
      is_interest_match: true,
    });
  });

  it("does not show a blocked author's requests", async () => {
    await admin.from("blocked_users").insert({ blocker_id: reader.id, blocked_id: author.id });

    const { rows } = await search(reader.accessToken, { query: `${TEST_MARKER}Kertészt` });

    expect(rows).toEqual([]);
  });
});

describeWithOpenAI("request-search: the semantic half", () => {
  it("finds a request by meaning when the reader's AI is on", async () => {
    const author = await data.createUser({ aiEnhance: true });
    const reader = await data.createUser({ aiEnhance: true });
    const created = await invokeFunction("create-request", {
      token: author.accessToken,
      body: { title: `${TEST_MARKER}Kertészt keresek`, description: "Sövényvágás, fűnyírás" },
    });
    expect(created.status).toBe(200);

    const { rows } = await search(reader.accessToken, { query: "növények gondozása" });

    expect(rows.map((r) => r.title)).toContain(`${TEST_MARKER}Kertészt keresek`);
  }, 90_000);
});
