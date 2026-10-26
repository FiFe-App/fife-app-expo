import { createClient } from "jsr:@supabase/supabase-js@2";
import OpenAI from "npm:openai";
import { isServiceRoleRequest } from "../_shared/auth.ts";

const supabaseUrl =
  Deno.env.get("SUPABASE_URL") || Deno.env.get("URL") || "http://127.0.0.1:54321";
const supabaseServiceRoleKey =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY") || "";
const openaiApiKey = Deno.env.get("OPENAI_API_KEY")!;
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * How many tags one call embeds. They go to OpenAI in a single request, so this is
 * bounded by the request size rather than by call count; callers that want the whole
 * backlog just call again until `remaining` comes back 0.
 */
const DEFAULT_BATCH = 200;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Costs money at OpenAI, so it is operator- and server-only, exactly like
  // fill-embeddings. The anon key ships inside the published app and must not reach it.
  if (!supabaseServiceRoleKey) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
  if (!isServiceRoleRequest(req, supabaseServiceRoleKey)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 401,
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  let limit = DEFAULT_BATCH;
  try {
    const body = await req.json();
    if (typeof body?.limit === "number") limit = body.limit;
  } catch {
    // No body is the normal case for a fire-and-forget invoke.
  }

  try {
    // The opt-out filtering lives in SQL (public.tags_pending_embedding) because it is a
    // join across both usage tables and user_settings — doing it here would mean pulling
    // the whole dictionary into the function just to throw most of it away.
    const { data: pending, error: pendingError } = await supabase.rpc(
      "tags_pending_embedding",
      { p_limit: limit },
    );
    if (pendingError) {
      console.error("could not list pending tags", pendingError.message);
      return new Response(JSON.stringify({ error: pendingError.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const tags = (pending ?? []) as { id: number; name: string }[];
    if (tags.length === 0) {
      console.log("embed-tags: nothing to do");
      return new Response(JSON.stringify({ embedded: 0, remaining: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`embed-tags: embedding ${tags.length} tag(s)`);

    // Deliberately NO gpt-4.1-mini keyword expansion here, unlike create-buziness and
    // business-search. That prompt's job (_shared/embedding.ts) is to turn a free-text
    // query into keywords — a tag already *is* a keyword. Skipping it is what makes the
    // batched call below possible (one embeddings request for hundreds of tags instead of
    // one LLM call each), and since both sides of the comparison in
    // public.interest_buziness_feed are tags, the vector space stays self-consistent.
    const openai = new OpenAI({ apiKey: openaiApiKey });
    const response = await openai.embeddings.create({
      model: "text-embedding-3-large",
      input: tags.map((t) => t.name),
      dimensions: 512,
    });

    if (response.data.length !== tags.length) {
      // Positional mapping is the only link between input and output here, so a length
      // mismatch would silently write one tag's vector onto another tag.
      console.error(
        `embedding count mismatch: asked for ${tags.length}, got ${response.data.length}`,
      );
      return new Response(JSON.stringify({ error: "Embedding count mismatch" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const embeddedAt = new Date().toISOString();
    let embedded = 0;
    for (let i = 0; i < tags.length; i++) {
      const { error } = await supabase
        .from("tags")
        .update({ embedding: response.data[i].embedding, embedded_at: embeddedAt })
        .eq("id", tags[i].id);
      if (error) {
        console.error(`could not store embedding for tag ${tags[i].id}`, error.message);
        continue;
      }
      embedded++;
    }

    // Lets a caller loop until the backlog is empty without guessing at batch sizes.
    const { data: rest } = await supabase.rpc("tags_pending_embedding", { p_limit: 1000 });
    const remaining = (rest ?? []).length;

    console.log(`embed-tags: embedded ${embedded}, ${remaining} remaining`);
    return new Response(JSON.stringify({ embedded, remaining }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("embed-tags failed", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// Backfill after deploying the tags dictionary (repeat until "remaining" is 0):
// curl -i --location --request POST 'https://<project>.supabase.co/functions/v1/embed-tags' \
//   --header 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
//   --header 'Content-Type: application/json'
