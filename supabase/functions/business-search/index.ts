import { createClient } from "jsr:@supabase/supabase-js@2";
import OpenAI from "npm:openai";

// Prefer standard env names (set by Supabase CLI in container); fallback to kong host
const supabaseUrl =
  Deno.env.get("SUPABASE_URL") ||
  Deno.env.get("URL") ||
  "http://supabase-kong:8000";
const supabaseServiceRoleKey =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
  Deno.env.get("SERVICE_ROLE_KEY") ||
  "";
const openaiApiKey = Deno.env.get("OPENAI_API_KEY")!;
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }
  const { query, skip, take, lat, long, maxdistance, ingyen, match_threshold, query_weight, distance_weight, recommendation_weight } = await req.json();

  // Instantiate OpenAI client
  const openai = new OpenAI({ apiKey: openaiApiKey });

  // Generate a one-time embedding for the user's query
  let embedding = null;
  if (query && query.length > 0) {
    console.log("query", query);
    const completion = await openai.responses.create({
      model: "gpt-4.1-mini",
      temperature: 0,
      instructions: "Írd fel vesszővel elválasztva az összes különböző szinonimát, rokon értelmű szót és kapcsolódó témát. Ne írj semmit, ha nincs értelme",
      input: query
    });
    const embedding_text = completion.output_text;

    console.log("embedding input", embedding_text);

    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-large",
      input: embedding_text,
      dimensions: 512,
    });
    embedding = embeddingResponse.data[0].embedding;
  }

  // Instantiate the Supabase client
  // (replace service role key with user's JWT if using Supabase auth and RLS)
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

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
  
  if (!supabaseServiceRoleKey) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY; cannot upsert buziness");
    return new Response(JSON.stringify({ error: "Missing Supabase credentials" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
  if (query && query.length > 0) {
  // Call hybrid_search Postgres function via RPC
    res = await supabase.rpc("hybrid_buziness_search", {
      skip,
      take,
      lat,
      long,
      query_embedding: embedding || Array.from({ length: 512 }, (_, i) => i),
      query_text: query,
      filter_ingyen: ingyen || false,
      match_threshold: match_threshold ?? 0.5,
      query_weight: query_weight ?? 1.0,
      distance_weight: distance_weight ?? 1.0,
      recommendation_weight: recommendation_weight ?? 0.3,
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
  console.log("res", res);
  

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
