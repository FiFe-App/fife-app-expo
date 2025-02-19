// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
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
  const { buziness } = await req.json();

  if (buziness.title) {
    const newTitle = buziness.title.replace(/(\s\$\s)+/g, ", ");
    console.log("run embedding with input", newTitle);

    const openai = new OpenAI({ apiKey: openaiApiKey });
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: newTitle,
      dimensions: 512,
    });
    console.log(embeddingResponse);
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const res = await supabase.from("buziness").upsert(
      {
        ...buziness,
        embedding: embeddingResponse.data[0].embedding,
      },
      { onConflict: "id" },
    );
    console.log(res);
    return new Response(JSON.stringify(res), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ error: "No title provided" }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/create-buziness' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
