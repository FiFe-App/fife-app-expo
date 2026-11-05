// Weekly admin report: new users, new businesses, reports, bad boys.
//
// Fired by pg_cron every Monday at 05:00 and 06:00 UTC (see
// migrations/20260930120000_admin_insights.sql). Exactly one of those is 08:00
// in Budapest, summer or winter time; the other run returns without sending.
// POST ?force=1 skips that check, for a manual test send.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6";
import { htmlToText, weeklyReportHtml, type WeeklyStats } from "../_shared/email.ts";
import { isServiceRoleRequest } from "../_shared/auth.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const smtpHost = Deno.env.get("SMTP_HOST") || "";
const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "465");
const smtpUser = Deno.env.get("SMTP_USER") || "";
const smtpPass = Deno.env.get("SMTP_PASS") || "";
const smtpFrom = Deno.env.get("SMTP_FROM") || smtpUser;

const reportEmail = Deno.env.get("ADMIN_REPORT_EMAIL") || "kristofakos1229@gmail.com";
const adminUrl = Deno.env.get("ADMIN_URL") || null;

const TIME_ZONE = "Europe/Budapest";
const SEND_HOUR = 8;
const DAY_MS = 24 * 60 * 60 * 1000;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Wall-clock date and time in Budapest for a given instant. */
function localParts(instant: number) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  }).formatToParts(new Date(instant));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    second: Number(get("second")),
    weekday: get("weekday"), // Mon, Tue, ...
  };
}

/** Milliseconds Budapest is ahead of UTC at a given instant. */
function offsetAt(instant: number): number {
  const p = localParts(instant);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(instant / 1000) * 1000;
}

/** The instant of 00:00 Budapest time on the given calendar date. */
function localMidnight(year: number, month: number, day: number): number {
  const guess = Date.UTC(year, month - 1, day);
  return guess - offsetAt(guess - offsetAt(guess));
}

/** The last full Monday-to-Monday week before `now`, in Budapest time. */
function previousWeek(now: number): { from: number; to: number } {
  const p = localParts(now);
  const weekdayIndex = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(p.weekday);
  const monday = new Date(Date.UTC(p.year, p.month - 1, p.day - weekdayIndex));
  const prevMonday = new Date(monday.getTime() - 7 * DAY_MS);
  return {
    from: localMidnight(prevMonday.getUTCFullYear(), prevMonday.getUTCMonth() + 1, prevMonday.getUTCDate()),
    to: localMidnight(monday.getUTCFullYear(), monday.getUTCMonth() + 1, monday.getUTCDate()),
  };
}

function periodLabel(from: number, to: number): string {
  const fmt = new Intl.DateTimeFormat("hu-HU", { timeZone: TIME_ZONE, year: "numeric", month: "long", day: "numeric" });
  // `to` is the next Monday 00:00 — the week itself ends the day before.
  return `${fmt.format(new Date(from))} – ${fmt.format(new Date(to - 1))}`;
}

Deno.serve(async (req) => {
  if (!supabaseServiceRoleKey) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
    return json({ error: "Server configuration error" }, 500);
  }
  // Reports on every user; only the database (pg_cron) or an operator may ask.
  if (!isServiceRoleRequest(req, supabaseServiceRoleKey)) {
    return json({ error: "Unauthorized" }, 401);
  }

  const now = Date.now();
  const force = new URL(req.url).searchParams.get("force") === "1";
  if (!force && localParts(now).hour !== SEND_HOUR) {
    return json({ ok: true, skipped: `not ${SEND_HOUR}:00 in ${TIME_ZONE}` });
  }

  if (!smtpHost || !smtpUser || !smtpPass || !smtpFrom.includes("@")) {
    console.error("Missing SMTP configuration");
    return json({ error: "Missing SMTP configuration" }, 500);
  }

  const { from, to } = previousWeek(now);
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  const { data, error } = await supabase.rpc("admin_weekly_stats", {
    p_from: new Date(from).toISOString(),
    p_to: new Date(to).toISOString(),
  });
  if (error || !data) {
    console.error("admin_weekly_stats failed:", error);
    return json({ error: error?.message ?? "No stats" }, 500);
  }

  const stats = data as WeeklyStats;
  const label = periodLabel(from, to);
  const html = weeklyReportHtml(stats, label, adminUrl);

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });

  try {
    const info = await transporter.sendMail({
      from: smtpFrom,
      to: reportEmail,
      subject: `Heti FiFe riport: ${stats.new_users} új felhasználó, ${stats.new_buziness} új biznisz`,
      html,
      text: htmlToText(html),
    });
    console.log(`Weekly report sent to ${reportEmail} — ${info.response || "(no response)"}`);
  } catch (err) {
    console.error("Weekly report send failed:", err);
    return json({ error: String(err) }, 500);
  }

  return json({ ok: true, sent_to: reportEmail, period: label, stats });
});
