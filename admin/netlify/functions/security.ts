import type { Handler } from "@netlify/functions";
import { isAuthenticated } from "./_lib/auth";
import { MAX_FAILED_ATTEMPTS, listBans, recentFailures, unban } from "./_lib/rateLimit";
import { getSupabaseAdmin } from "./_lib/supabase";

function json(statusCode: number, body: unknown) {
  return { statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

// IPv4 / IPv6 / a login által használt "unknown" — bármi más hibás kérés.
const IP_RE = /^(unknown|[0-9a-fA-F:.]{2,45})$/;

export const handler: Handler = async (event) => {
  if (!isAuthenticated(event.headers.cookie)) {
    return json(401, { error: "Nincs bejelentkezve." });
  }

  try {
    const supabase = getSupabaseAdmin();

    if (event.httpMethod === "GET") {
      const [bans, failures] = await Promise.all([listBans(supabase), recentFailures(supabase)]);
      return json(200, { bans, failures, maxFailedAttempts: MAX_FAILED_ATTEMPTS });
    }

    if (event.httpMethod === "DELETE") {
      let payload: Record<string, unknown>;
      try {
        payload = JSON.parse(event.body || "{}");
      } catch {
        return json(400, { error: "Érvénytelen kérés." });
      }
      const ip = typeof payload.ip === "string" ? payload.ip.trim() : "";
      if (!IP_RE.test(ip)) return json(400, { error: "Érvénytelen IP cím." });
      await unban(supabase, ip);
      return json(200, { ok: true });
    }

    return { statusCode: 405, body: "Method Not Allowed" };
  } catch (err) {
    return json(500, { error: err instanceof Error ? err.message : "Ismeretlen szerverhiba." });
  }
};
