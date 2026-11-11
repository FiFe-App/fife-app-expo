import type { HandlerEvent } from "@netlify/functions";
import type { SupabaseClient } from "@supabase/supabase-js";

// Ennyi sikertelen belépés után az adott IP-t kizárjuk az ablak végéig.
export const MAX_FAILED_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;
const RETENTION_MS = 24 * 60 * 60 * 1000;

const TABLE = "admin_login_attempts";

/**
 * A hívó IP-je. Az `x-nf-client-connection-ip` headert a Netlify maga állítja
 * be a kapcsolatból, a kliens nem tudja felülírni — az `x-forwarded-for`-ral
 * ellentétben, amit bárki tetszőlegesre küldhet.
 */
export function clientIp(event: Pick<HandlerEvent, "headers">): string {
  return event.headers["x-nf-client-connection-ip"] || event.headers["client-ip"] || "unknown";
}

/** Igaz, ha ez az IP az elmúlt 15 percben elérte a sikertelen próbák limitjét. */
export async function isLockedOut(supabase: SupabaseClient, ip: string): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const { count, error } = await supabase
    .from(TABLE)
    .select("id", { count: "exact", head: true })
    .eq("ip", ip)
    .gte("created_at", since);
  if (error) throw new Error(error.message);
  return (count ?? 0) >= MAX_FAILED_ATTEMPTS;
}

export async function recordFailure(supabase: SupabaseClient, ip: string): Promise<void> {
  const { error } = await supabase.from(TABLE).insert({ ip });
  if (error) throw new Error(error.message);
  // Takarítás menet közben, hogy a tábla ne nőjön a végtelenségig.
  await supabase
    .from(TABLE)
    .delete()
    .lt("created_at", new Date(Date.now() - RETENTION_MS).toISOString());
}

export async function clearFailures(supabase: SupabaseClient, ip: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("ip", ip);
  if (error) throw new Error(error.message);
}
