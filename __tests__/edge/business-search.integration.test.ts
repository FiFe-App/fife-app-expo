/**
 * business-search against a running Supabase stack.
 *
 * The no-query branch (a plain listing) needs no OpenAI key, so the world
 * filter, the ingyen filter and paging are all covered for free. The hybrid
 * search branch generates an embedding, so it sits behind OPENAI_API_KEY —
 * except for a caller who opted out of the AI, whose text query is answered by
 * full-text search with no key involved.
 */
import { createHash } from "node:crypto";

import { adminClient, edgeStack, invokeFunction, readBody } from "@/test-utils/edge/clients";
import { TestData, TEST_MARKER } from "@/test-utils/edge/fixtures";
import { describeWithOpenAI } from "@/test-utils/edge/gates";

const data = new TestData();
const admin = adminClient();

/** Same hash the function uses to key the embedding cache. */
const queryHash = (query: string) =>
  createHash("sha256").update(query.trim().toLowerCase()).digest("hex");

const titlesOf = (rows: unknown) =>
  (rows as { title: string }[]).map((row) => row.title);

afterAll(async () => {
  await data.cleanup();
});

describe("business-search: authentication", () => {
  it("rejects a request with no bearer token", async () => {
    const res = await invokeFunction("business-search", { body: {} });

    expect(res.status).toBe(401);
  });

  it("rejects the public anon key", async () => {
    const res = await invokeFunction("business-search", {
      token: edgeStack().anonKey,
      body: {},
    });

    expect(res.status).toBe(401);
    expect(await readBody(res)).toMatchObject({ error: "Unauthorized" });
  });
});

describe("business-search: listing without a query", () => {
  let searcher: { id: string; accessToken: string };
  let ghost: { id: string; accessToken: string };
  let normalBuziness: { id: number; title: string };
  let ghostBuziness: { id: number; title: string };
  let freeBuziness: { id: number; title: string };

  beforeAll(async () => {
    searcher = await data.createUser();
    ghost = await data.createUser({ badBoy: true });
    normalBuziness = await data.seedBuziness(searcher.id);
    freeBuziness = await data.seedBuziness(searcher.id, { ingyen: true });
    ghostBuziness = await data.seedBuziness(ghost.id);
  });

  it("returns the caller's own world", async () => {
    const res = await invokeFunction("business-search", {
      token: searcher.accessToken,
      body: { take: 50 },
    });

    expect(res.status).toBe(200);
    expect(titlesOf(await readBody(res))).toContain(normalBuziness.title);
  });

  // Marked `failing` because the listing branch embeds the author profile
  // *without* `!inner`, and PostgREST applies such a filter to the embedded rows
  // rather than to the parent — so ghost ("bad_boy") businesses are expected to
  // leak into a normal user's listing. The hybrid-search branch has no such
  // problem: it filters inside the RPC.
  //
  // If this reports "passed even though it was supposed to fail", the embed does
  // filter parents on this PostgREST version — drop `.failing` and keep it as a
  // regression test. If it fails as expected, the fix is one word in
  // business-search/index.ts: `profiles!buziness_author_fkey1!inner(bad_boy)`.
  it.failing("hides businesses from the ghost world", async () => {
    const res = await invokeFunction("business-search", {
      token: searcher.accessToken,
      body: { take: 50 },
    });

    expect(res.status).toBe(200);
    expect(titlesOf(await readBody(res))).not.toContain(ghostBuziness.title);
  });

  it("filters to free businesses when ingyen is set", async () => {
    const res = await invokeFunction("business-search", {
      token: searcher.accessToken,
      body: { take: 50, ingyen: true },
    });

    expect(res.status).toBe(200);
    const titles = titlesOf(await readBody(res));
    expect(titles).toContain(freeBuziness.title);
    expect(titles).not.toContain(normalBuziness.title);
  });

  it("pages with take", async () => {
    const res = await invokeFunction("business-search", {
      token: searcher.accessToken,
      body: { take: 1 },
    });

    expect(res.status).toBe(200);
    expect((await readBody(res)) as unknown[]).toHaveLength(1);
  });
});

describeWithOpenAI("business-search: hybrid search", () => {
  const query = `${TEST_MARKER}vízvezeték szerelés`;
  let searcher: { id: string; accessToken: string };

  beforeAll(async () => {
    // Opted in: with the setting off the function never reaches OpenAI, which
    // is what the "the AI setting" suite below covers.
    searcher = await data.createUser({ aiEnhance: true });
    await data.seedBuziness(searcher.id, {
      title: `${TEST_MARKER}vízvezeték-szerelő`,
      description: "Csaptelep és vízvezeték javítás",
      embedding_text: "vízvezeték szerelés csaptelep javítás",
    });
    data.trackCachedQuery(query);
  });

  it("answers a text query and caches the embedding for the next caller", async () => {
    const first = await invokeFunction("business-search", {
      token: searcher.accessToken,
      body: { query, take: 20, match_threshold: 0 },
    });
    expect(first.status).toBe(200);

    // The cache write is fire-and-forget, so give it a moment to land.
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const { data: cached } = await admin
      .from("query_embedding_cache")
      .select("query_text, hit_count")
      .eq("query_hash", queryHash(query))
      .maybeSingle();
    expect(cached?.query_text).toBe(query.trim().toLowerCase());

    const second = await invokeFunction("business-search", {
      token: searcher.accessToken,
      body: { query, take: 20, match_threshold: 0 },
    });
    expect(second.status).toBe(200);

    await new Promise((resolve) => setTimeout(resolve, 1500));
    const { data: afterHit } = await admin
      .from("query_embedding_cache")
      .select("hit_count")
      .eq("query_hash", queryHash(query))
      .maybeSingle();
    expect(afterHit?.hit_count).toBeGreaterThan(cached?.hit_count ?? 0);
  }, 90_000);
});

/**
 * The radius filter, and what it must not do to a "Bárhol" biznisz.
 *
 * These send lat/long/maxdistance the way the app does — the parameters the
 * suites above leave out, which is exactly why the bug survived them. No
 * OpenAI key needed: the searcher has the AI off, so ranking is full text.
 */
describe("business-search: listings with no location", () => {
  const query = `${TEST_MARKER}kertkapu`;
  // Budapest, and a point far enough away that a 10 km radius excludes it.
  const BUDAPEST = { lat: 47.4979, long: 19.0402 };
  const FAR_AWAY = "POINT(21.6273 47.5316)"; // Debrecen, ~200 km east

  let searcher: { id: string; accessToken: string };
  let anywhere: { id: number; title: string };
  let faraway: { id: number; title: string };

  beforeAll(async () => {
    searcher = await data.createUser({ aiEnhance: false });
    anywhere = await data.seedBuziness(searcher.id, { title: query });
    faraway = await data.seedBuziness(searcher.id, {
      title: `${query} messze`,
      location: FAR_AWAY,
    });
  });

  it("finds a biznisz saved without a location, whatever the radius", async () => {
    const res = await invokeFunction("business-search", {
      token: searcher.accessToken,
      body: {
        query,
        take: 20,
        match_threshold: 0,
        ...BUDAPEST,
        maxdistance: 10_000,
      },
    });

    expect(res.status).toBe(200);
    expect(titlesOf(await readBody(res))).toContain(anywhere.title);
  });

  it("still keeps a located biznisz outside the radius out", async () => {
    // The escape hatch is for a missing location, not for every location.
    const res = await invokeFunction("business-search", {
      token: searcher.accessToken,
      body: {
        query,
        take: 20,
        match_threshold: 0,
        ...BUDAPEST,
        maxdistance: 10_000,
      },
    });

    expect(titlesOf(await readBody(res))).not.toContain(faraway.title);
  });

  it("reports no distance for it, rather than claiming it is next to you", async () => {
    const res = await invokeFunction("business-search", {
      token: searcher.accessToken,
      body: {
        query,
        take: 20,
        match_threshold: 0,
        ...BUDAPEST,
        maxdistance: 100_000,
      },
    });

    const rows = (await readBody(res)) as { title: string; distance: number | null }[];
    const row = rows.find((r) => r.title === anywhere.title);
    // The client shows "Bárhol elérhető" off the back of this being absent.
    expect(row?.distance ?? null).toBeNull();
  });
});

/**
 * Not gated on OPENAI_API_KEY: a caller who opted out must get results without
 * the function calling OpenAI at all, so this runs with no key configured.
 */
describe("business-search: the AI setting", () => {
  const query = `${TEST_MARKER}kulcsszavas keresés`;
  let searcher: { id: string; accessToken: string };

  beforeAll(async () => {
    searcher = await data.createUser({ aiEnhance: false });
    await data.seedBuziness(searcher.id, {
      title: query,
      description: "Kulcsszavakra is megtalálható",
      embedding_text: query,
    });
    data.trackCachedQuery(query);
  });

  it("still answers a text query, by full text alone", async () => {
    const res = await invokeFunction("business-search", {
      token: searcher.accessToken,
      body: { query, take: 20, match_threshold: 0 },
    });

    expect(res.status).toBe(200);
    // The title matches the query word for word, so FTS alone has to find it.
    const rows = (await readBody(res)) as { title: string }[];
    expect(rows.some((row) => row.title === query)).toBe(true);
  });

  it("leaves the query out of the embedding cache", async () => {
    await invokeFunction("business-search", {
      token: searcher.accessToken,
      body: { query, take: 20, match_threshold: 0 },
    });

    // Same wait the cached path needs, so a write would have landed by now.
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const { data: cached } = await admin
      .from("query_embedding_cache")
      .select("query_text")
      .eq("query_hash", queryHash(query))
      .maybeSingle();
    expect(cached).toBeNull();
  });
});
