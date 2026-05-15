import { createClient } from "jsr:@supabase/supabase-js@2";
import OpenAI from "npm:openai";

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
  console.log("fill-embeddings start");
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  const openai = new OpenAI({ apiKey: openaiApiKey });
  try {
    const { data: businesses } = await supabase.from("buziness").select("*");

    if (!businesses) return new Response("no data", { status: 500 });

    for (const business of businesses) {
      console.log("id", business.id, business.title);

      if (business.title && !business.embedding_text) {
        const input =
          business.title.replace(/(\s\$\s)+/g, ", ") +
          (business.description
            ? business.description
            : "");
        console.log("run embedding with input", input);

        const completion = await openai.responses.create({
          model: "gpt-4.1-mini",
          temperature: 0.3,
          instructions: "Írd fel vesszővel elválasztva az összes különböző szinonimát, rokon értelmű szót és kapcsolódó témát. Ne írj semmit, ha nincs értelme",
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
