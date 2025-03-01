import { createClient } from "jsr:@supabase/supabase-js@2";
import OpenAI from "npm:openai";

const supabaseUrl = Deno.env.get("URL")!;
const supabaseServiceRoleKey = Deno.env.get("SERVICE_ROLE_KEY")!;
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
  const { query, skip, take, lat, long, maxdistance } = await req.json();

  // Instantiate OpenAI client
  const openai = new OpenAI({ apiKey: openaiApiKey });

  // Generate a one-time embedding for the user's query
  let embedding = null;
  if (query) {
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-large",
      input: query,
      dimensions: 512,
    });
    console.log(embeddingResponse.data);

    const [{ embedding }] = embeddingResponse.data;
  }

  // Instantiate the Supabase client
  // (replace service role key with user's JWT if using Supabase auth and RLS)
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  // Call hybrid_search Postgres function via RPC
  const res = await supabase.rpc("hybrid_buziness_search", {
    distance: maxdistance,
    skip,
    take,
    lat,
    long,
    query_embedding: embedding || Array.from({ length: 512 }, (_, i) => i),
    query_text: query,
  });

  console.log("RESPONSE BELOW");

  console.log("-----------------------------------------------");
  console.log(res);
  console.log("-----------------------------------------------");

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
