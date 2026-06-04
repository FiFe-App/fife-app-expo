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

  const { query, skip, take, lat, long, maxdistance, ingyen, match_threshold, query_weight, distance_weight, recommendation_weight } = await req.json();

  if (!supabaseServiceRoleKey) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
    return new Response(JSON.stringify({ error: "Missing Supabase credentials" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  // Instantiate service role Supabase client (needed for cache lookup and RPC)
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  // Instantiate OpenAI client
  const openai = new OpenAI({ apiKey: openaiApiKey });

  // Generate (or retrieve cached) embedding for the user's query
  let embedding = null;
  if (query && query.length > 0) {
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
      const completion = await openai.responses.create({
        model: "gpt-4.1-mini",
        temperature: 0,
        instructions: embedding_instructions,
        input: query,
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
      lat: lat || 47.4979,
      long: long || 19.0402,
      query_embedding: embedding || Array.from({ length: 512 }, (_, i) => i),
      query_text: query,
      filter_ingyen: ingyen || false,
      match_threshold: match_threshold ?? 0.4,
      query_weight: query_weight ?? 1.0,
      distance_weight: distance_weight ?? 0,
      recommendation_weight: recommendation_weight ?? 0,
      fts_weight: 1
    });
  } else {
    console.log("no query, normal search");
    
    let q = supabase
      .from("buziness")
      .select("*, recommendations: buzinessRecommendations!buzinessRecommendations_buziness_id_fkey(count)");
    if (ingyen) q = q.eq("ingyen", true);
    res = await q
      .range(skip || 0, (skip || 0) + (take < 1 ? 20 : take) - 1)
      .order("created_at", { ascending: false });
  }
  if (res.error) {
    console.error("search rpc error", res.error);
    return new Response(JSON.stringify({ error: res.error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
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
