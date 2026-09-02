// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6";
import {
  buzinessRecommendationHtml,
  commentHtml,
  htmlToText,
  messageHtml,
  newsletterHtml,
  profileRecommendationHtml,
} from "../_shared/email.ts";
import { isServiceRoleRequest } from "../_shared/auth.ts";
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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

let smtpConfigLogged = false;

/**
 * Logged once per worker, before the first send.
 *
 * The From address rides on every outgoing mail, so it is not a secret — and it
 * is the first thing to check when SMTP accepts a message that then never
 * arrives, since a From that the sending host is not authorised for fails
 * SPF/DKIM alignment at the receiver. Note especially whether it came from
 * SMTP_FROM or fell back to SMTP_USER.
 */
function logSmtpConfigOnce() {
  if (smtpConfigLogged) return;
  smtpConfigLogged = true;
  console.log(
    `SMTP config: host=${smtpHost || "(unset)"} port=${smtpPort} secure=${smtpPort === 465} ` +
      `from=${smtpFrom || "(unset)"} ` +
      (Deno.env.get("SMTP_FROM") ? "(from SMTP_FROM)" : "(SMTP_FROM unset — fell back to SMTP_USER)"),
  );
}

async function sendEmailNotification(
  email: string,
  subject: string,
  html: string,
  headers?: Record<string, string>,
) {
  // Throws rather than returns: a newsletter run counts every settled send as
  // delivered, so returning quietly here would mark the whole issue "sent"
  // without a single mail having left the function.
  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error("Missing SMTP credentials — set SMTP_HOST, SMTP_USER and SMTP_PASS");
  }
  if (!smtpFrom.includes("@")) {
    throw new Error(`SMTP_FROM is not an email address: "${smtpFrom}"`);
  }
  logSmtpConfigOnce();

  const info = await getTransporter().sendMail({
    from: smtpFrom,
    to: email,
    subject,
    html,
    // multipart/alternative: an HTML-only bulk mail filters badly.
    text: htmlToText(html),
    ...(headers ? { headers } : {}),
  });

  // sendMail only rejects when *every* recipient was refused, so a partial
  // refusal has to be turned into an error by hand.
  if (info.rejected?.length) {
    throw new Error(
      `SMTP rejected ${info.rejected.join(", ")}: ${info.response || "no response"}`,
    );
  }

  // Log the server's own answer. "Email sent" on its own says only that nothing
  // threw; the queue id below is what identifies the message to the mail
  // provider when it was accepted here but never arrived.
  console.log(
    `Email sent to ${email} from ${info.envelope?.from ?? smtpFrom} — ` +
      `${info.response || "(no response)"} messageId=${info.messageId || "?"}`,
  );
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
  /** 'subscribers' (opt-ins) or 'all' (every registered user). See the audience column. */
  audience: string | null;
  /** Addresses to skip for this issue only, whatever the audience says. */
  excluded: string[] | null;
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
    // Anything but an exact "all" is treated as the opt-in audience, so a webhook
    // replayed from a payload that predates the column still sends to subscribers.
    const audience = record.audience === "all" ? "all" : "subscribers";
    // Resolved server-side alongside the audience so the count the admin showed
    // before sending and the list walked here cannot disagree.
    const excluded = record.excluded?.filter((e) => e && e.trim() !== "") ?? [];
    const { data: recipients, error } = await supabase.rpc("get_newsletter_recipients", {
      p_emails: explicit.length > 0 ? explicit : null,
      p_audience: audience,
      p_exclude: excluded.length > 0 ? excluded : null,
    });
    if (error) throw error;

    const list = (recipients ?? []) as { email: string; full_name: string | null }[];
    // Name the audience: a small number here is the difference between "the send
    // failed" and "the opt-in list really is that small", and the log is where
    // that question gets answered.
    console.log(
      `Newsletter ${record.id}: ${list.length} recipient(s)`,
      explicit.length > 0
        ? "(explicit list)"
        : audience === "all"
          ? "(every registered user)"
          : "(newsletter subscribers only)",
      excluded.length > 0 ? `— ${excluded.length} exception(s) applied` : "",
    );

    let sent = 0;
    let failed = 0;
    const failures: string[] = [];

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
          failures.push(String(result.reason));
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
        // Without this, why a send failed lives only in the edge logs, which
        // roll off long before anyone asks why an issue underdelivered.
        error: failures.length > 0
          ? [...new Set(failures)].join("\n").slice(0, 2000)
          : null,
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

  // This function sends push notifications and emails to arbitrary users, so it
  // must only be reachable by the database trigger, which posts with the service
  // role key. Without this check the public anon key is enough to spoof any
  // notification to any user.
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

  const payload = await req.json();

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
