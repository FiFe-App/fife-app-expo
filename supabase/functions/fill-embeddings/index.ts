import { createClient } from "jsr:@supabase/supabase-js@2";
import OpenAI from "npm:openai";
import { embedding_instructions } from "../_shared/embedding.ts";
import { isServiceRoleRequest } from "../_shared/auth.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || Deno.env.get("URL") || "http://127.0.0.1:54321";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY") || "";
const openaiApiKey = Deno.env.get("OPENAI_API_KEY")!;
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  // Maintenance job: re-embeds every buziness row, so each call costs real money
  // at OpenAI. Operator-only — the public anon key must not be able to trigger it.
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

  console.log("fill-embeddings start");
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  const openai = new OpenAI({ apiKey: openaiApiKey });
  try {
    const { data: businesses } = await supabase.from("buziness").select("*");

    if (!businesses) return new Response("no data", { status: 500 });

    // Authors who turned "AI-s megtalálhatóság" off. A maintenance run must not
    // be the back door that sends their listing text to OpenAI anyway. Their
    // rows are left exactly as they are — create-buziness clears the embedding
    // columns the next time the owner saves the listing.
    const { data: optedOut, error: optedOutError } = await supabase
      .from("user_settings")
      .select("author")
      .eq("ai_enhance", false);
    if (optedOutError) {
      // Without the list every skip decision would be a guess, and guessing
      // wrong here means sending text the user asked us not to send.
      console.error("Could not read the opt-out list:", optedOutError.message);
      return new Response(JSON.stringify({ error: "Could not read the opt-out list" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }
    const skipAuthors = new Set(
      (optedOut ?? []).map((row: { author: string }) => row.author),
    );

    for (const business of businesses) {
      console.log("id", business.id, business.title);

      if (skipAuthors.has(business.author)) {
        console.log("skipping", business.id, "— its author opted out of the AI");
        continue;
      }

      if (business.title) {
        const input =
          business.title.replace(/(\s\$\s)+/g, ", ") +
          (business.description
            ? business.description
            : "");
        console.log("run embedding with input", input);

        const completion = await openai.responses.create({
          model: "gpt-4.1-mini",
          temperature: 0.3,
          instructions: embedding_instructions,
          input
        });


        const embeddingText = completion.output_text;

        const embeddingResponse = await openai.embeddings.create({
          model: "text-embedding-3-large",
          input: embeddingText,
          dimensions: 512,
        });

        const res = await supabase
          .from("buziness")
          .update({
            embedding: embeddingResponse.data[0].embedding,
            embedding_text: embeddingText,
          })
          .eq("id", business.id);
        console.log(res);
      }
    }
    return new Response("ok", { headers: corsHeaders });
  } catch (error) {
    console.log("error", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
// Example CURL command:
// curl -i --location --request POST 'https://your-project.supabase.co/functions/v1/fill-embeddings' \
//   --header 'Authorization: Bearer YOUR_ANON_KEY' \
//   --header 'Content-Type: application/json'

// Add CORS support
