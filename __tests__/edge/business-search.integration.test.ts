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

  // This used to be `it.failing`: the listing branch embedded the author profile
  // *without* `!inner`, and PostgREST applies such a filter to the embedded rows rather
  // than to the parent, so ghost ("bad_boy") businesses leaked into a normal user's
  // listing. The branch is now public.interest_buziness_feed, which joins profiles for
  // real inside the RPC — the same way the hybrid-search branch always did — so the leak
  // is gone and this is a plain regression test again.
  it("hides businesses from the ghost world", async () => {
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

describe("business-search: interest-driven listing", () => {
  let searcher: { id: string; accessToken: string };
  let gardening: { id: number; title: string };
  let unrelated: { id: number; title: string };

  beforeAll(async () => {
    searcher = await data.createUser();
    // Seeded oldest-first so plain "created_at DESC" would put `unrelated` on top. That
    // is what makes the reordering below visible rather than coincidental.
    gardening = await data.seedBuziness(searcher.id, {
      title: `${TEST_MARKER}kertész $ kertészet $ metszés`,
    });
    unrelated = await data.seedBuziness(searcher.id, {
      title: `${TEST_MARKER}autószerelő $ autószerelés`,
    });
  });

  it("keeps the plain newest-first order when there are no interests", async () => {
    const res = await invokeFunction("business-search", {
      token: searcher.accessToken,
      body: { take: 50, interests: [] },
    });

    expect(res.status).toBe(200);
    const titles = titlesOf(await readBody(res));
    expect(titles.indexOf(unrelated.title)).toBeLessThan(titles.indexOf(gardening.title));
  });

  it("sorts the matching listings to the front", async () => {
    const res = await invokeFunction("business-search", {
      token: searcher.accessToken,
      body: { take: 50, interests: ["kertészet"] },
    });

    expect(res.status).toBe(200);
    const titles = titlesOf(await readBody(res));
    expect(titles.indexOf(gardening.title)).toBeLessThan(titles.indexOf(unrelated.title));
  });

  it("never empties the list — the non-matching ones still follow", async () => {
    const res = await invokeFunction("business-search", {
      token: searcher.accessToken,
      body: { take: 50, interests: [`${TEST_MARKER}nothing-matches-this`] },
    });

    expect(res.status).toBe(200);
    const titles = titlesOf(await readBody(res));
    expect(titles).toContain(gardening.title);
    expect(titles).toContain(unrelated.title);
  });

  it("ORs the tags rather than ANDing them", async () => {
    // The whole point of interests: two unrelated tags must both pull their own topic
    // forward, not narrow the result to listings that match both.
    const res = await invokeFunction("business-search", {
      token: searcher.accessToken,
      body: { take: 50, interests: ["kertészet", "autószerelés"] },
    });

    expect(res.status).toBe(200);
    const titles = titlesOf(await readBody(res));
    expect(titles.slice(0, 2)).toEqual(
      expect.arrayContaining([gardening.title, unrelated.title]),
    );
  });

  it("pages without repeating or dropping a listing", async () => {
    const page = async (skip: number) =>
      titlesOf(
        await readBody(
          await invokeFunction("business-search", {
            token: searcher.accessToken,
            body: { take: 1, skip, interests: ["kertészet"] },
          }),
        ),
      );

    const [first] = await page(0);
    const [second] = await page(1);

    expect(first).toBe(gardening.title);
    expect(second).not.toBe(first);
  });

  it("treats a tag containing query syntax as literal text", async () => {
    // The tags are user input and go straight into a pgroonga query, where OR and
    // parentheses are operators. An unescaped one would either error or quietly widen
    // the match.
    const res = await invokeFunction("business-search", {
      token: searcher.accessToken,
      body: { take: 50, interests: ["kertészet OR autószerelés) \""] },
    });

    expect(res.status).toBe(200);
    expect(titlesOf(await readBody(res))).toContain(gardening.title);
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
