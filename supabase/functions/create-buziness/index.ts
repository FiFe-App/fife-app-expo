// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.
// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import OpenAI from "npm:openai";
// Prefer standard env names; fallback to local defaults
const supabaseUrl = Deno.env.get("SUPABASE_URL") || Deno.env.get("URL") || "http://127.0.0.1:54321";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY") || "";
const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
Deno.serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  const buziness = await req.json();
  console.log(buziness);
  
  // Validate that user has title
  if (!buziness.title) {
    return new Response(JSON.stringify({
      error: "No title provided"
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 400,
    });
  }
  
  // Validate that user has at least one contact before proceeding
  if (!supabaseServiceRoleKey) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY; cannot check contacts");
    return new Response(JSON.stringify({ error: "Missing Supabase credentials" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  
  // Check if user has at least one contact with non-empty data
  const { data: contacts, error: contactsError } = await supabase
    .from("contacts")
    .select("id")
    .eq("author", buziness.author)
    .not("data", "is", null)
    .neq("data", "");
  
  if (contactsError) {
    console.error("Error checking contacts:", contactsError);
    return new Response(JSON.stringify({ 
      error: "Failed to verify contact requirements" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
  
  if (!contacts || contacts.length === 0) {
    console.log("User has no contacts, cannot create buziness");
    return new Response(JSON.stringify({ 
      error: "At least one contact is required to create a buziness" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
  
  // Proceed with buziness creation
  const openai = new OpenAI({
    apiKey: openaiApiKey
  });
  const input = "Categories: " + buziness.title.replace(/(\s\$\s)+/g, ", ") + (buziness.description ? " | Description: " + buziness.description : "");
  console.log("run embedding with input", input);
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "Írd körül röviden azt az embert, aki ezekhez ért: " + input
      }
    ]
  });
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-large",
    input: completion.choices[0].message.content,
    dimensions: 512
  });
  console.log(embeddingResponse);
  
  const res = await supabase.from("buziness").upsert({
    ...buziness,
    embedding: embeddingResponse.data[0].embedding,
    embedding_text: completion.choices[0].message.content,
  }, {
    onConflict: "id"
  });
  console.log(res);
  if (!res.error) return new Response(JSON.stringify(res), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
  
  return new Response(JSON.stringify({
    error: res.error?.message || "Failed to create buziness"
  }), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    },
    status: 500,
  });
}); /* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/create-buziness' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/ 
