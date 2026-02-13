import { createClient } from "jsr:@supabase/supabase-js@2";
import OpenAI from "npm:openai";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  console.log("insert");
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return new Response(
      JSON.stringify({ error: "Supabase env not set" }),
      { status: 500, headers: corsHeaders },
    );
  }
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  const openai = new OpenAI({ apiKey: openaiApiKey ?? undefined });
  try {
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "Missing OPENAI_API_KEY" }),
        { status: 500, headers: corsHeaders },
      );
    }
    const { data: businesses, error } = await supabase
      .from("buziness")
      .select("*");

    if (error) {
      console.error("Supabase select error", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: corsHeaders },
      );
    }

    if (!businesses || businesses.length === 0) {
      return new Response(
        JSON.stringify({ message: "No businesses found" }),
        { status: 200, headers: corsHeaders },
      );
    }

    for (const business of businesses) {
      //if (business.embedding) continue;
      console.log("id", business.id, business.title);

      if (business.title) {
        const input =
          "Categories: " +
          business.title.replace(/(\s\$\s)+/g, ", ") +
          (business.description
            ? " | Description: " + business.description
            : "");
        console.log("run embedding with input", input);
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content:
                "Írd le a(z) "+input+" szakma kulcsszavait, szinonímáit",
            },
          ],
        });

        const embeddingResponse = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: completion.choices[0].message.content,
          dimensions: 512
        });
        console.log(embeddingResponse);

        const res = await supabase
          .from("buziness")
          .update({ 
            embedding: embeddingResponse.data[0].embedding,
            embedding_text: completion.choices[0].message.content
          })
          .eq("id", business.id);
        console.log(res);
      }
    }
    return new Response(JSON.stringify({ status: "ok", processed: businesses.length }), {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("error", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: corsHeaders },
    );
  }
});
// Example CURL command:
// curl -i --location --request POST 'https://your-project.supabase.co/functions/v1/fill-embeddings' \
//   --header 'Authorization: Bearer YOUR_ANON_KEY' \
//   --header 'Content-Type: application/json'

// Add CORS support
