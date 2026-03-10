// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const oneSignalAppId = Deno.env.get("ONESIGNAL_APP_ID") || "";
const oneSignalRestApiKey = Deno.env.get("ONESIGNAL_REST_API_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function sendNotification(externalUserId: string, message: string) {
  if (!oneSignalAppId || !oneSignalRestApiKey) {
    console.error("Missing OneSignal credentials");
    return;
  }
  const body = {
    app_id: oneSignalAppId,
    include_aliases: { external_id: [externalUserId] },
    target_channel: "push",
    contents: { en: message, hu: message },
  };
  const res = await fetch("https://onesignal.com/api/v1/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${oneSignalRestApiKey}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  console.log("OneSignal response:", data);
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const payload = await req.json();
  console.log("Webhook payload:", JSON.stringify(payload));

  const { table, record } = payload;

  if (!record || !supabaseServiceRoleKey) {
    return new Response(JSON.stringify({ error: "Invalid payload or missing credentials" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    if (table === "buzinessRecommendations") {
      // Fetch the author's name and the buziness owner + title
      const [authorRes, buzinessRes] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", record.author).maybeSingle(),
        supabase.from("buziness").select("author, title").eq("id", record.buziness_id).maybeSingle(),
      ]);
      const authorName = authorRes.data?.full_name || "Valaki";
      const buziness = buzinessRes.data;
      if (buziness && buziness.author !== record.author) {
        const buzinessTitle = buziness.title?.split(" $ ")[0] || "bizniszedet";
        const message = `${authorName} ajánlja a ${buzinessTitle} bizniszedet!`;
        await sendNotification(buziness.author, message);
      }
    } else if (table === "profileRecommendations") {
      // Fetch the author's name
      const authorRes = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", record.author)
        .maybeSingle();
      const authorName = authorRes.data?.full_name || "Valaki";
      if (record.profile_id && record.profile_id !== record.author) {
        const message = `${authorName} megbízhatónak jelölt!`;
        await sendNotification(record.profile_id, message);
      }
    } else if (table === "comments") {
      // key format: "buziness/{id}"
      const key: string = record.key || "";
      if (key.startsWith("buziness/")) {
        const buzinessId = key.replace("buziness/", "");
        const [authorRes, buzinessRes] = await Promise.all([
          supabase.from("profiles").select("full_name").eq("id", record.author).maybeSingle(),
          supabase.from("buziness").select("author, title").eq("id", buzinessId).maybeSingle(),
        ]);
        const authorName = authorRes.data?.full_name || "Valaki";
        const buziness = buzinessRes.data;
        if (buziness && buziness.author !== record.author) {
          const buzinessTitle = buziness.title?.split(" $ ")[0] || "bizniszedhez";
          const message = `${authorName} kommentet írt a ${buzinessTitle} bizniszedhez!`;
          await sendNotification(buziness.author, message);
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error in notify function:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
