// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const supabaseUrl = Deno.env.get("EXPO_PUBLIC_SUPABASE_URL") || "";
const supabaseServiceRoleKey = Deno.env.get("EXPO_PUBLIC_SUPABASE_ANON_KEY") || "";

// Rackhost SMTP config (set via supabase secrets)
const smtpHost = Deno.env.get("SMTP_HOST") || "";
const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "465");
const smtpUser = Deno.env.get("SMTP_USER") || "";
const smtpPass = Deno.env.get("SMTP_PASS") || "";
const smtpFrom = Deno.env.get("SMTP_FROM") || smtpUser;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function sendPushNotification(pushToken: string, message: string) {
  if (!pushToken) {
    console.log("No push token, skipping push notification");
    return;
  }
  const body = {
    to: pushToken,
    title: "FiFe",
    body: message,
    sound: "default",
  };
  const res = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  console.log("Expo Push response:", data);
  return data;
}

async function sendEmailNotification(email: string, subject: string, message: string) {
  if (!smtpHost || !smtpUser || !smtpPass) {
    console.error("Missing SMTP credentials, skipping email");
    return;
  }
  try {
    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: smtpPort,
        tls: true,
        auth: { username: smtpUser, password: smtpPass },
      },
    });
    await client.send({
      from: smtpFrom,
      to: email,
      subject,
      html: `<p>${message}</p>`,
    });
    await client.close();
    console.log("Email sent to", email);
  } catch (err) {
    console.error("SMTP error:", err);
  }
}

async function getNotificationPrefs(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data } = await supabase.rpc("get_notification_prefs_for", { user_id: userId });
  console.log(data);
  
  return data?.[0] ?? { notify_push: true, notify_email: false, email: null, push_token: "ExponentPushToken[q0dNuPCvDncNMNxNgIhn0l]" };
}

async function sendNotification(supabase: ReturnType<typeof createClient>, targetUserId: string, message: string, subject?: string) {
  const prefs = await getNotificationPrefs(supabase, targetUserId);
  console.log("user prefs:",prefs);
  
  const promises: Promise<unknown>[] = [];
  if (prefs.notify_push && prefs.push_token) {
    promises.push(sendPushNotification(prefs.push_token, message));
  }
  if (prefs.notify_email && prefs.email) {
    promises.push(sendEmailNotification(prefs.email, subject || "FiFe értesítés", message));
  }
  if (promises.length === 0) {
    console.log(`User ${targetUserId} has all notifications disabled or missing tokens`);
    return;
  }
  await Promise.all(promises);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  console.log("env", supabaseUrl);
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
        await sendNotification(supabase, buziness.author, message);
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
        await sendNotification(supabase, record.profile_id, message);
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
          await sendNotification(supabase, buziness.author, message);
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
