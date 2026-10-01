import { createClient } from "jsr:@supabase/supabase-js@2";
import OpenAI from "npm:openai";
import { embedding_instructions } from "../_shared/embedding.ts";

// Prefer standard env names (set by Supabase CLI in container); fallback to kong host
const supabaseUrl =
  Deno.env.get("SUPABASE_URL") ||
  Deno.env.get("URL") ||
  "http://supabase-kong:8000";
const supabaseServiceRoleKey =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
  Deno.env.get("SERVICE_ROLE_KEY") ||
  "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
const openaiApiKey = Deno.env.get("OPENAI_API_KEY")!;
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MODEL_VERSION = "gpt-4.1-mini/text-embedding-3-large";
const MAX_QUERY_LENGTH = 200;
// The map view asks for every pin with take: -1; that now means "up to MAX_TAKE".
const MAX_TAKE = 500;

function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  const n = typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : fallback;
  return Math.min(Math.max(n, min), max);
}

async function hashQuery(normalized: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(normalized));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  // Require a valid authenticated JWT
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 401,
    });
  }
  const token = authHeader.replace("Bearer ", "");
  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 401,
    });
  }

  if (!supabaseServiceRoleKey) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
    return new Response(JSON.stringify({ error: "Missing Supabase credentials" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  // Instantiate service role Supabase client (needed for cache lookup and RPC)
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  // Fetch the caller's bad_boy status — used to restrict results to the same "world"
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("bad_boy")
    .eq("id", user.id)
    .single();
  if (profileError) {
    console.error("Could not read the caller's bad_boy flag:", profileError.message);
  }
  // Defaults to the normal world. Defaulting the other way puts a caller whose
  // profile row simply failed to load into the ghost world, where every query
  // joins against nothing and comes back empty with no error to show for it.
  const isBadBoy: boolean = profile?.bad_boy ?? false;

  // "AI-s megtalálhatóság": with it off, the search text never leaves for
  // OpenAI. Read server-side, like the flag in create-buziness — a privacy
  // choice the client could set for itself is not a choice. A missing or
  // unreadable settings row means the query stays put.
  const { data: settings, error: settingsError } = await supabase
    .from("user_settings")
    .select("ai_enhance")
    .eq("author", user.id)
    .maybeSingle();
  if (settingsError) {
    console.error("Could not read the caller's ai_enhance flag:", settingsError.message);
  }
  const aiEnhance: boolean = settings?.ai_enhance ?? false;

  const body = await req.json();
  const { lat, long, maxdistance, ingyen, match_threshold, fts_weight, semantic_weight, score_sort, distance_sort, recommendation_sort, interests } = body;
  // Every unique query costs an OpenAI call, and `take: -1` used to reach the
  // SQL as LIMIT NULL (the whole table) — bound what a caller can ask for.
  const query: string = typeof body.query === "string" ? body.query.slice(0, MAX_QUERY_LENGTH) : "";
  const skip = clampInt(body.skip, 0, 0, Number.MAX_SAFE_INTEGER);
  const take = body.take === -1 ? MAX_TAKE : clampInt(body.take, 20, 1, MAX_TAKE);

  // The tags are user text and go straight into a pgroonga query, so they are trimmed,
  // de-duplicated and capped here before the database ever sees them. MAX_INTERESTS is
  // about keeping that query bounded, not about the user's settings.
  const MAX_INTERESTS = 20;
  const cleanInterests: string[] = Array.isArray(interests)
    ? Array.from(
        new Set(
          interests
            .filter((t: unknown): t is string => typeof t === "string")
            .map((t: string) => t.trim())
            .filter((t: string) => t.length > 0),
        ),
      ).slice(0, MAX_INTERESTS)
    : [];

  // A brand new interest tag has no vector yet, so it can only match literally until
  // embed-tags catches up. Nudging that function here is what makes the semantic half
  // start working on the *next* load rather than whenever someone next saves a biznisz.
  // The lookup is one indexed hit on a small table, and both the check and the invoke are
  // fire-and-forget: a failure here must not cost the user their feed.
  if (cleanInterests.length > 0) {
    // Must match public.normalize_tag: lowercase, collapse inner whitespace, trim.
    const normalized = cleanInterests.map((t) =>
      t.toLowerCase().replace(/\s+/g, " ").trim()
    );
    supabase
      .from("tags")
      .select("id")
      .in("normalized", normalized)
      .is("embedding", null)
      .limit(1)
      .then(({ data: unembedded }) => {
        if (unembedded && unembedded.length > 0) {
          console.log("interest tags without an embedding — invoking embed-tags");
          return supabase.functions.invoke("embed-tags").then(() => {});
        }
      })
      .then(undefined, (e: unknown) => console.warn("embed-tags nudge failed", e));
  }

  // Generate (or retrieve cached) embedding for the user's query.
  //
  // The cache is skipped as well, not just the OpenAI call: a caller with the
  // AI off gets keyword-only ranking every time, rather than semantic results
  // for the queries somebody else happened to have embedded already.
  let embedding = null;
  if (query && query.length > 0 && aiEnhance) {
    const normalized = query.trim().toLowerCase();
    const queryHash = await hashQuery(normalized);

    const { data: cached, error: cacheError } = await supabase
      .from("query_embedding_cache")
      .select("embedding, hit_count")
      .eq("query_hash", queryHash)
      .eq("model_version", MODEL_VERSION)
      .maybeSingle();

    if (cacheError) console.warn("embedding cache lookup failed", cacheError.message);

    if (cached) {
      console.log("embedding cache hit", queryHash);
      // Postgres returns vector columns as a text string "[0.1,...]"; parse to number[].
      embedding = typeof cached.embedding === "string"
        ? JSON.parse(cached.embedding)
        : cached.embedding;
      // Fire-and-forget: bump usage stats
      supabase
        .from("query_embedding_cache")
        .update({ last_used_at: new Date().toISOString(), hit_count: cached.hit_count + 1 })
        .eq("query_hash", queryHash)
        .eq("model_version", MODEL_VERSION)
        .then(() => {});
    } else {
      console.log("embedding cache miss", query);
      const openai = new OpenAI({ apiKey: openaiApiKey });
      const completion = await openai.responses.create({
        model: "gpt-4.1-mini",
        temperature: 0,
        instructions: embedding_instructions,
        input: query,
        max_output_tokens: 500,
      });
      const embedding_text = completion.output_text;
      console.log("embedding input", embedding_text);

      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-large",
        input: embedding_text,
        dimensions: 512,
      });
      embedding = embeddingResponse.data[0].embedding;

      // Fire-and-forget: cache the result for future searches
      supabase
        .from("query_embedding_cache")
        .insert({
          query_hash: queryHash,
          query_text: normalized,
          embedding_text,
          embedding,
          model_version: MODEL_VERSION,
        })
        .then(() => {});
    }
  }

  console.log("params", {
    skip,
    take,
    lat,
    long,
    query_embedding: embedding ? "[...512 dims]" : "none",
    query_text: query,
  });

  let res;
  console.log("query", query && query.length > 0);

  if (query && query.length > 0) {
  // Call hybrid_search Postgres function via RPC
    res = await supabase.rpc("hybrid_buziness_search", {
      skip,
      take,
      lat: lat || 0,
      long: long || 0,
      max_distance: maxdistance || 0,
      // A zero vector scores 0 against everything under inner product, which
      // leaves the ranking to full-text search. The previous fallback was
      // [0,1,2,…,511], whose huge arbitrary dot product either swamps the
      // threshold or buries every row beneath it.
      query_embedding: embedding || Array.from({ length: 512 }, () => 0),
      query_text: query,
      filter_ingyen: ingyen || false,
      match_threshold: match_threshold ?? 0.6,
      fts_weight: fts_weight ?? 1,
      semantic_weight: semantic_weight ?? 1.0,
      score_sort: score_sort ?? 1.0,
      distance_sort: distance_sort ?? 0.0,
      recommendation_sort: recommendation_sort ?? 0.3,
      filter_bad_boy: isBadBoy,
    });
  } else {
    console.log("no query, interest feed");

    // The community screen's opening list. With no interests this is byte-for-byte the
    // old "created_at DESC, id DESC" page; with interests, the matching listings sort to
    // the front and the rest follow, so the list never comes back empty and skip-based
    // paging stays deterministic. See the migration for why the semantic half compares
    // tag to tag rather than against buziness.embedding.
    //
    // No OpenAI call happens on this path: every vector it needs is precomputed in
    // public.tags by the embed-tags function.
    res = await supabase.rpc("interest_buziness_feed", {
      p_interests: cleanInterests,
      p_semantic: true,
      p_match_threshold: match_threshold ?? 0.6,
      p_ingyen: ingyen || false,
      p_bad_boy: isBadBoy,
      p_skip: skip,
      p_take: take,
    });
  }
  if (res.error) {
    console.error("search rpc error", res.error);
    return new Response(JSON.stringify({ error: "Search failed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  // An empty result is a 200 with [] — indistinguishable from a broken filter
  // unless the filters that produced it are on the record. Every one of these
  // can empty the result set on its own.
  const rows = res.data?.length ?? 0;
  console.log(`search returned ${rows} row(s)`);
  if (rows === 0) {
    console.log("empty result, filters were", {
      query_text: query,
      embedding: embedding
        ? "present"
        : aiEnhance
          ? "MISSING (zero vector, FTS only)"
          : "off by ai_enhance (zero vector, FTS only)",
      filter_bad_boy: isBadBoy,
      match_threshold: match_threshold ?? 0.6,
      fts_weight: fts_weight ?? 1,
      semantic_weight: semantic_weight ?? 1.0,
      max_distance: maxdistance,
      lat,
      long,
      filter_ingyen: ingyen || false,
      interests: cleanInterests,
      skip,
      take,
    });
  }

  return new Response(JSON.stringify(res.data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/business-search' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
