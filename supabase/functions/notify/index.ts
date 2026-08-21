// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6";
import {
  buzinessRecommendationHtml,
  commentHtml,
  messageHtml,
  newsletterHtml,
  profileRecommendationHtml,
} from "../_shared/email.ts";
import { unsubscribeUrl } from "../_shared/unsubscribe.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || Deno.env.get("EXPO_PUBLIC_SUPABASE_URL") || "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Rackhost SMTP config (set via supabase secrets)
const smtpHost = Deno.env.get("SMTP_HOST") || "";
const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "465");
const smtpUser = Deno.env.get("SMTP_USER") || "";
const smtpPass = Deno.env.get("SMTP_PASS") || "";
const smtpFrom = Deno.env.get("SMTP_FROM") || smtpUser;
const expoAccessToken = Deno.env.get("EXPO_ACCESS_TOKEN") || "";
// Optional dedicated webhook secret. When set here *and* in
// private.app_config.notify_secret, the DB trigger authenticates with it instead of
// the service role key. Leave unset to authenticate with the service role key only.
const notifyWebhookSecret = Deno.env.get("NOTIFY_WEBHOOK_SECRET") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-notify-secret",
};

/** Length-independent comparison so a wrong secret cannot be guessed by timing. */
function secretsMatch(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Describes a presented bearer token for the logs without ever printing it.
 * Legacy Supabase keys are JWTs, so the role they carry (anon / service_role)
 * is what tells you which key the caller was configured with.
 */
function describeToken(token: string): string {
  if (!token) return "none";
  if (token.startsWith("sb_secret_")) return "secret API key";
  if (token.startsWith("sb_publishable_")) return "publishable API key";
  const parts = token.split(".");
  if (parts.length !== 3) return "opaque token";
  try {
    const json = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    const role = JSON.parse(json)?.role;
    return role ? `JWT with role "${role}"` : "JWT without a role claim";
  } catch {
    return "unparseable JWT";
  }
}

/**
 * This function is invoked by the database (pg_net, via
 * trigger_notify_on_record_created) rather than by a signed-in user, so the
 * platform JWT gate is turned off for it in supabase/config.toml and the caller
 * is authenticated here instead. That keeps notifications working no matter how
 * the project's API keys are formatted or rotated, and makes a misconfigured
 * caller show up as a named role in the logs instead of an opaque gateway 401.
 *
 * Returns null when the call is authorized, otherwise the reason to log.
 */
function authorizeWebhook(req: Request): string | null {
  const presentedSecret = req.headers.get("x-notify-secret") || "";
  if (notifyWebhookSecret) {
    if (secretsMatch(presentedSecret, notifyWebhookSecret)) return null;
  } else if (presentedSecret) {
    return "x-notify-secret was sent but NOTIFY_WEBHOOK_SECRET is not set on the function";
  }

  const bearer = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!bearer) return "no Authorization header and no matching x-notify-secret";
  if (!supabaseServiceRoleKey) return "SUPABASE_SERVICE_ROLE_KEY is not available to the function";
  if (secretsMatch(bearer, supabaseServiceRoleKey)) return null;

  return `caller presented a ${describeToken(bearer)}, expected the service role key`;
}

async function sendPushNotification(pushToken: string, message: string, data?: Record<string, unknown>) {
  if (!pushToken) {
    console.log("No push token, skipping push notification");
    return;
  }
  const body: Record<string, unknown> = {
    to: pushToken,
    title: "FiFe App",
    body: message,
    sound: "default",
  };
  if (data) body.data = data;
  
  const res = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Authorization": "Bearer "+expoAccessToken,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  const result = await res.json();
  console.log("Expo Push response:", result);
  return result;
}

// Pooled transporter: a newsletter run sends hundreds of mails and must not
// open a fresh SMTP connection per recipient.
let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
      pool: true,
      maxConnections: 3,
      maxMessages: 100,
    });
  }
  return transporter;
}

async function sendEmailNotification(
  email: string,
  subject: string,
  html: string,
  headers?: Record<string, string>,
) {
  if (!smtpHost || !smtpUser || !smtpPass) {
    console.error("Missing SMTP credentials, skipping email");
    return;
  }
  await getTransporter().sendMail({
    from: smtpFrom,
    to: email,
    subject,
    html,
    ...(headers ? { headers } : {}),
  });
  console.log("Email sent to", email);
}

/** Transactional notifications must never fail the whole webhook on an SMTP error. */
async function sendEmailNotificationSafe(email: string, subject: string, html: string) {
  try {
    await sendEmailNotification(email, subject, html);
  } catch (err) {
    console.error("SMTP error:", err);
  }
}

async function getNotificationPrefs(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data } = await supabase.rpc("get_notification_prefs_for", { user_id: userId });
  console.log(data);
  return data?.[0] ?? { notify_push: true, notify_email: false, email: null, push_token: null, full_name: null };
}

async function sendNotification(
  supabase: ReturnType<typeof createClient>,
  targetUserId: string,
  message: string,
  options: {
    subject?: string;
    htmlBuilder?: (recipientName: string | null) => string;
    data?: Record<string, unknown>;
  } = {},
) {
  const prefs = await getNotificationPrefs(supabase, targetUserId);
  console.log("user prefs:", prefs);

  const promises: Promise<unknown>[] = [];
  if (prefs.notify_push && prefs.push_token) {
    promises.push(sendPushNotification(prefs.push_token, message, options.data));
  }
  if (prefs.notify_email && prefs.email) {
    const html = options.htmlBuilder
      ? options.htmlBuilder(prefs.full_name ?? null)
      : `<p>${message}</p>`;
    promises.push(sendEmailNotificationSafe(prefs.email, options.subject || "FiFe értesítés", html));
  }
  if (promises.length === 0) {
    console.log(`User ${targetUserId} has all notifications disabled or missing tokens`);
    return;
  }
  await Promise.all(promises);
}

type NewsletterRecord = {
  id: number;
  subject: string;
  title: string | null;
  body: string;
  cta_label: string | null;
  cta_url: string | null;
  recipients: string[] | null;
  status: string;
};

// Sent in small batches so one bad address can't stall the run and so we stay
// under the SMTP provider's rate limit.
const NEWSLETTER_BATCH_SIZE = parseInt(Deno.env.get("NEWSLETTER_BATCH_SIZE") || "10");
const NEWSLETTER_BATCH_DELAY_MS = parseInt(Deno.env.get("NEWSLETTER_BATCH_DELAY_MS") || "1000");

async function sendNewsletter(
  supabase: ReturnType<typeof createClient>,
  record: NewsletterRecord,
) {
  // Guard against re-sends: only a freshly inserted, still-pending row is sent.
  const { data: claimed, error: claimError } = await supabase
    .from("newsletters")
    .update({ status: "sending" })
    .eq("id", record.id)
    .eq("status", "pending")
    .select("id");

  if (claimError) {
    // Runs detached in waitUntil — log and stop rather than reject unhandled.
    console.error(`Newsletter ${record.id}: could not claim row:`, claimError);
    return;
  }
  if (!claimed || claimed.length === 0) {
    console.log(`Newsletter ${record.id} is not pending — skipping`);
    return;
  }

  try {
    const explicit = record.recipients?.filter((e) => e && e.trim() !== "") ?? [];
    const { data: recipients, error } = await supabase.rpc("get_newsletter_recipients", {
      p_emails: explicit.length > 0 ? explicit : null,
    });
    if (error) throw error;

    const list = (recipients ?? []) as { email: string; full_name: string | null }[];
    console.log(
      `Newsletter ${record.id}: ${list.length} recipient(s)`,
      explicit.length > 0 ? "(explicit list)" : "(all subscribers)",
    );

    let sent = 0;
    let failed = 0;

    for (let i = 0; i < list.length; i += NEWSLETTER_BATCH_SIZE) {
      const batch = list.slice(i, i + NEWSLETTER_BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(async (recipient) => {
          const url = await unsubscribeUrl(recipient.email);
          await sendEmailNotification(
            recipient.email,
            record.subject,
            newsletterHtml(recipient.full_name, record, url),
            {
              // RFC 8058 — lets Gmail/Outlook show a native unsubscribe button.
              "List-Unsubscribe": `<${url}>`,
              "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            },
          );
        }),
      );

      for (const result of results) {
        if (result.status === "fulfilled") {
          sent++;
        } else {
          failed++;
          console.error("Newsletter send failed:", result.reason);
        }
      }

      if (i + NEWSLETTER_BATCH_SIZE < list.length && NEWSLETTER_BATCH_DELAY_MS > 0) {
        await new Promise((resolve) => setTimeout(resolve, NEWSLETTER_BATCH_DELAY_MS));
      }
    }

    await supabase
      .from("newsletters")
      .update({
        status: "sent",
        sent_count: sent,
        failed_count: failed,
        sent_at: new Date().toISOString(),
      })
      .eq("id", record.id);

    console.log(`Newsletter ${record.id} done: ${sent} sent, ${failed} failed`);
  } catch (err) {
    console.error(`Newsletter ${record.id} failed:`, err);
    await supabase
      .from("newsletters")
      .update({ status: "failed", error: String(err) })
      .eq("id", record.id);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const rejection = authorizeWebhook(req);
  if (rejection) {
    console.error(`Rejected notify webhook: ${rejection}`);
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        detail:
          "notify must be called with the project's service role key (or a matching x-notify-secret). " +
          "Check private.app_config — run: select * from private.notify_config_status();",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      },
    );
  }

  console.log("env", supabaseUrl);
  // The body is whatever row_to_json() produced, so the record's shape depends on
  // which table the trigger fired for.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let payload: { table?: string; record?: Record<string, any> };
  try {
    payload = await req.json();
  } catch (err) {
    console.error("Could not parse notify webhook body:", err);
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
  console.log("Webhook payload:", JSON.stringify(payload));

  const { table, record } = payload;

  if (!record) {
    return new Response(JSON.stringify({ error: "Invalid payload" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    if (table === "newsletters") {
      // A newsletter run can take minutes — answer the webhook right away and
      // keep sending in the background so pg_net doesn't time out on us.
      const task = sendNewsletter(supabase, record as NewsletterRecord);
      if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
        EdgeRuntime.waitUntil(task);
      } else {
        await task;
      }
      return new Response(JSON.stringify({ ok: true, queued: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else if (table === "buzinessRecommendations") {
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
        await sendNotification(supabase, buziness.author, message, {
          subject: `${authorName} ajánlja a bizniszedet!`,
          htmlBuilder: (name) => buzinessRecommendationHtml(name, authorName, buzinessTitle, record.buziness_id),
          data: { url: `/biznisz/${record.buziness_id}` },
        });
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
        await sendNotification(supabase, record.profile_id, message, {
          subject: `${authorName} megbízhatónak jelölt!`,
          htmlBuilder: (name) => profileRecommendationHtml(name, authorName, record.author),
          data: { url: `/user/${record.profile_id}` },
        });
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
          await sendNotification(supabase, buziness.author, message, {
            subject: `${authorName} kommentet írt a bizniszedhez!`,
            htmlBuilder: (name) => commentHtml(name, authorName, buzinessTitle, buzinessId),
            data: { url: `/biznisz/${buzinessId}` },
          });
        }
      }
    } else if (table === "messages") {
      // Notify recipient of a new message, rate-limited to 1 per 60s per sender→recipient pair
      if (typeof record.text === "string" && record.text.startsWith("heart-")) {
        // Heart reactions are stored as message rows but aren't real messages — skip
      } else if (!record.to || record.to === record.author) {
        // No recipient or self-message — skip
      } else {
        // Rate-limit: check if there's a recent message from same author→to within last 60s
        const cutoff = new Date(new Date(record.created_at).getTime() - 3600).toISOString();
        const { count } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("author", record.author)
          .eq("to", record.to)
          .gt("created_at", cutoff)
          .lt("created_at", record.created_at)
          .limit(1);

        if (count && count > 0) {
          console.log(`Rate-limited: message notification skipped for ${record.author} → ${record.to}`);
        } else {
          const authorRes = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", record.author)
            .maybeSingle();
          const senderName = authorRes.data?.full_name || "Valaki";
          const preview =
            (record.text || "").slice(0, 100) ||
            (record.image ? "📷 Képet küldött" : "");
          const message = `${senderName}: ${preview}`;
          await sendNotification(supabase, record.to, message, {
            subject: `${senderName} üzenetet küldött!`,
            htmlBuilder: (name) => messageHtml(name, senderName, record.author, preview),
            data: { url: `/chat/${record.author}` },
          });
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
