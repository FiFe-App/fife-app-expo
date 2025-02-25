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
    return new Response("ok", { headers: corsHeaders });
  }
  console.log("insert");
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  const openai = new OpenAI({ apiKey: openaiApiKey });
  try {
    const { data: businesses } = await supabase.from("buziness").select("*");

    if (!businesses) return;

    for (const business of businesses) {
      console.log("id", business.id, business.title);

      if (business.title) {
        const input =
          "Categories: " +
          business.title.replace(/(\s\$\s)+/g, ", ") +
          (business.description
            ? " | Description: " + business.description
            : "");
        console.log("run embedding with input", input);

        const embeddingResponse = await openai.embeddings.create({
          model: "text-embedding-3-large",
          input,
          dimensions: 512,
        });
        console.log(embeddingResponse);

        const res = await supabase
          .from("buziness")
          .update({ embedding: embeddingResponse.data[0].embedding })
          .eq("id", business.id);
        console.log(res);
      }
    }
    return new Response("ok", { body: "ok" });
  } catch (error) {
    console.log("error", error);
  }
});
// Example CURL command:
// curl -i --location --request POST 'https://your-project.supabase.co/functions/v1/fill-embeddings' \
//   --header 'Authorization: Bearer YOUR_ANON_KEY' \
//   --header 'Content-Type: application/json'

// Add CORS support
