import type { Handler, HandlerResponse } from "@netlify/functions";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSessionCookie, passwordMatches } from "./_lib/auth";
import { clearFailures, clientIp, isLockedOut, recordFailure } from "./_lib/rateLimit";
import { getSupabaseAdmin } from "./_lib/supabase";

// A korlátozás hibája (hiányzó env, elérhetetlen Supabase) nem zárhatja ki az
// admint: ilyenkor a belépés korlát nélkül megy tovább, de a log megmutatja.
async function safely<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error(`login rate limit (${label}) failed:`, err);
    return fallback;
  }
}

export const handler: Handler = async (event): Promise<HandlerResponse> => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let password = "";
  try {
    const body = JSON.parse(event.body || "{}");
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Érvénytelen kérés." }) };
  }

  const ip = clientIp(event);
  const supabase = await safely<SupabaseClient | null>("client", async () => getSupabaseAdmin(), null);

  // Kizárt IP-nél a jelszót meg sem nézzük, különben a 429 mellett is
  // folytatható lenne a találgatás.
  if (supabase && (await safely("check", () => isLockedOut(supabase, ip), false))) {
    return {
      statusCode: 429,
      headers: { "Content-Type": "application/json", "Retry-After": "900" },
      body: JSON.stringify({ error: "Túl sok sikertelen próbálkozás. Próbáld újra 15 perc múlva." }),
    };
  }

  if (!passwordMatches(password)) {
    if (supabase) await safely("record", () => recordFailure(supabase, ip), undefined);
    return { statusCode: 401, body: JSON.stringify({ error: "Hibás jelszó." }) };
  }

  if (supabase) await safely("clear", () => clearFailures(supabase, ip), undefined);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": createSessionCookie(),
    },
    body: JSON.stringify({ ok: true }),
  };
};
