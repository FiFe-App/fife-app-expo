import { corsHeaders } from "./../_shared/cors.ts";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import OpenAI from "npm:openai";
 
// Prefer standard env names (set by Supabase CLI in container); fallback to kong host
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRoleKey =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
  Deno.env.get("SERVICE_ROLE_KEY") ||
  "";
const openaiApiKey = Deno.env.get("OPENAI_API_KEY")!;

Deno.serve(async (req) => {
  // Instantiate the Supabase client
  // (replace service role key with user's JWT if using Supabase auth and RLS)
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }
  const authHeader = req.headers.get("Authorization")!;
  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getClaims(token);
  const userEmail = data?.claims?.email;
  if (!userEmail || error) {
    return Response.json(
      { msg: "Invalid JWT" },
      {
        status: 401,
      }
    );
  }
  const { query, skip, take, lat, long, maxdistance } = await req.json();

  // Instantiate OpenAI client
  const openai = new OpenAI({ apiKey: openaiApiKey });

  // Generate a one-time embedding for the user's query
  let embedding = null;
  if (query && query.length > 0) {
    console.log("query", query);
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Írd körül röviden azt az embert, aki ezekhez ért: " + query,
        },
      ],
    });

    console.log("embedding input", completion.choices[0].message.content);

    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-large",
      input: completion.choices[0].message.content,
      dimensions: 512,
    });
    embedding = embeddingResponse.data[0].embedding;
  }


  console.log("params", {
    distance: maxdistance,
    skip,
    take,
    lat,
    long,
    query_embedding: embedding || Array.from({ length: 1536 }, (_, i) => i),
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
      distance: maxdistance,
      skip,
      take,
      lat,
      long,
      query_embedding: embedding || Array.from({ length: 512 }, (_, i) => i),
      query_text: query,
    });
  } else {
    console.log("no query, normal search");
    
    res = await supabase
      .from("buziness")
      .select("*, recommendations: buzinessRecommendations!buzinessRecommendations_buziness_id_fkey(count)")
      .range(skip || 0, (skip || 0) + (take || 20) - 1)
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
