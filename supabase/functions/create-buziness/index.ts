// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.
// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import OpenAI from "npm:openai";
import { embedding_instructions } from "../_shared/embedding.ts";
// Prefer standard env names; fallback to local defaults
const supabaseUrl = Deno.env.get("SUPABASE_URL") || Deno.env.get("URL") || "http://127.0.0.1:54321";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY") || "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
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

  const buziness = await req.json();

  // Validate that user has title and it is a non-empty string
  if (!buziness.title || typeof buziness.title !== "string") {
    return new Response(JSON.stringify({
      error: "Title must be a non-empty string"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
  // Normalize title: collapse consecutive or empty " $ " segments
  // e.g. "title $  $  $  key1" → "title $ key1"
  const titleSegments = buziness.title.split(/\s*\$\s*/).map((s: string) => s.trim()).filter(Boolean);
  if (titleSegments.length === 0) {
    return new Response(JSON.stringify({
      error: "Title cannot be empty after normalization"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
  buziness.title = titleSegments.join(" $ ");
  
  // Validate that user has at least one contact before proceeding
  if (!supabaseServiceRoleKey) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY; cannot check contacts");
    return new Response(JSON.stringify({ error: "Missing Supabase credentials" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  // The row is written with the service role client, which bypasses RLS, so
  // ownership has to be enforced here. Never trust buziness.author from the body.
  const author = user.id;

  // An id in the body means "update". Verify the caller owns that row, otherwise
  // any authenticated user could overwrite anyone else's buziness by guessing an id.
  const requestedId = buziness.id;
  if (requestedId !== undefined && requestedId !== null) {
    const { data: existing, error: existingError } = await supabase
      .from("buziness")
      .select("author")
      .eq("id", requestedId)
      .maybeSingle();

    if (existingError) {
      console.error("Error loading buziness for update:", existingError);
      return new Response(JSON.stringify({ error: "Failed to load buziness" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }
    if (!existing || existing.author !== author) {
      // Same response whether it is missing or owned by someone else, so this
      // cannot be used to probe which ids exist.
      return new Response(JSON.stringify({ error: "Not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }
  }

  // Check if user has at least one contact with non-empty data
  const { data: contacts, error: contactsError } = await supabase
    .from("contacts")
    .select("id")
    .eq("author", author)
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
  
  // "AI-s megtalálhatóság": the user decides whether their listing text may be
  // sent to OpenAI at all. Read here rather than taken from the request body —
  // a privacy choice the client could set for itself is not a choice.
  // No settings row (or an unreadable one) means the text stays put.
  const { data: settings, error: settingsError } = await supabase
    .from("user_settings")
    .select("ai_enhance")
    .eq("author", author)
    .maybeSingle();
  if (settingsError) {
    console.error("Could not read the author's ai_enhance flag:", settingsError.message);
  }
  const aiEnhance: boolean = settings?.ai_enhance ?? false;

  // Both stay null when the AI is off. They are sent to the upsert as explicit
  // nulls, which clears whatever a previous save left behind: turning the
  // setting off and saving the listing again is what removes its AI-derived
  // columns.
  let embedding_text: string | null = null;
  let embedding: number[] | null = null;

  if (aiEnhance) {
    const openai = new OpenAI({
      apiKey: openaiApiKey
    });
    const input = buziness.title.replace(/(\s\$\s)+/g, ", ") + (buziness.description || "");
    console.log("run embedding with input", input);
    const completion = await openai.responses.create({
      model: "gpt-4.1-mini",
      temperature: 0.3,
      instructions: embedding_instructions,
      input
    });

    embedding_text = completion.output_text;
    console.log("embedding_text", embedding_text);

    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-large",
      input: embedding_text,
      dimensions: 512
    });
    embedding = embeddingResponse.data[0].embedding;
  } else {
    console.log("ai_enhance is off for", author, "— skipping OpenAI, clearing the embedding");
  }
  
  // Explicit allowlist. Spreading the request body would let a caller set
  // author, created_at, or the embedding columns that drive search ranking.
  const row: Record<string, unknown> = {
    author,
    title: buziness.title,
    description: buziness.description,
    ingyen: buziness.ingyen,
    location: buziness.location,
    defaultContact: buziness.defaultContact,
    radius: buziness.radius,
    images: buziness.images,
    embedding,
    embedding_text,
  };
  // Keep nulls (they clear a column) but drop keys the client never sent.
  for (const key of Object.keys(row)) {
    if (row[key] === undefined) delete row[key];
  }
  // Only set after the ownership check above; absent on create so the identity
  // sequence assigns the id.
  if (requestedId !== undefined && requestedId !== null) row.id = requestedId;

  const res = await supabase.from("buziness").upsert(row, {
    onConflict: "id"
  }).select().single();
  if (!res.error) return new Response(JSON.stringify(res.data), {
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
