import type { HandlerEvent } from "@netlify/functions";
import type { SupabaseClient } from "@supabase/supabase-js";

// Ennyi sikertelen belépés 15 percen belül, és az IP véglegesen ki van tiltva,
// amíg kézzel fel nem oldják (Biztonság oldal, vagy SQL — lásd README).
export const MAX_FAILED_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;
const RETENTION_MS = 24 * 60 * 60 * 1000;

const ATTEMPTS = "admin_login_attempts";
const BANS = "admin_ip_bans";

/**
 * A hívó IP-je. Az `x-nf-client-connection-ip` headert a Netlify maga állítja
 * be a kapcsolatból, a kliens nem tudja felülírni — az `x-forwarded-for`-ral
 * ellentétben, amit bárki tetszőlegesre küldhet.
 */
export function clientIp(event: Pick<HandlerEvent, "headers">): string {
  return event.headers["x-nf-client-connection-ip"] || event.headers["client-ip"] || "unknown";
}

/**
 * Az ADMIN_IP_ALLOWLIST-ben felsorolt IP-ket soha nem tiltjuk ki, hogy a
 * végleges tiltással ne lehessen kizárni magunkat (pl. egy elgépelt jelszó-
 * kezelő bejegyzéssel).
 */
export function isAllowlisted(ip: string): boolean {
  const list = (process.env.ADMIN_IP_ALLOWLIST ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  return list.includes(ip);
}

export async function isBanned(supabase: SupabaseClient, ip: string): Promise<boolean> {
  const { data, error } = await supabase.from(BANS).select("ip").eq("ip", ip).maybeSingle();
  if (error) throw new Error(error.message);
  return data !== null;
}

/**
 * Felírja a sikertelen próbát, és ha ezzel az IP elérte a limitet, kitiltja.
 * Igazzal tér vissza, ha az IP mostantól ki van tiltva.
 */
export async function recordFailure(supabase: SupabaseClient, ip: string): Promise<boolean> {
  const { error } = await supabase.from(ATTEMPTS).insert({ ip });
  if (error) throw new Error(error.message);

  // Takarítás menet közben, hogy a napló ne nőjön a végtelenségig. A tiltások
  // maradnak: azok egy másik táblában vannak.
  await supabase
    .from(ATTEMPTS)
    .delete()
    .lt("created_at", new Date(Date.now() - RETENTION_MS).toISOString());

  if (isAllowlisted(ip)) return false;

  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const { count, error: countError } = await supabase
    .from(ATTEMPTS)
    .select("id", { count: "exact", head: true })
    .eq("ip", ip)
    .gte("created_at", since);
  if (countError) throw new Error(countError.message);
  if ((count ?? 0) < MAX_FAILED_ATTEMPTS) return false;

  const now = new Date().toISOString();
  const { error: banError } = await supabase
    .from(BANS)
    .upsert({ ip, failed_attempts: count ?? 0, last_attempt_at: now }, { onConflict: "ip" });
  if (banError) throw new Error(banError.message);
  console.warn(`admin login: ${ip} banned after ${count} failed attempts`);
  return true;
}

export async function clearFailures(supabase: SupabaseClient, ip: string): Promise<void> {
  const { error } = await supabase.from(ATTEMPTS).delete().eq("ip", ip);
  if (error) throw new Error(error.message);
}

export interface BanRow {
  ip: string;
  banned_at: string;
  failed_attempts: number;
  last_attempt_at: string;
}

export async function listBans(supabase: SupabaseClient): Promise<BanRow[]> {
  const { data, error } = await supabase
    .from(BANS)
    .select("ip, banned_at, failed_attempts, last_attempt_at")
    .order("banned_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  return (data ?? []) as BanRow[];
}

/** Az utolsó 24 óra sikertelen próbái IP-nként, a legtöbbel elöl. */
export async function recentFailures(
  supabase: SupabaseClient,
): Promise<{ ip: string; attempts: number; last_attempt_at: string }[]> {
  const { data, error } = await supabase
    .from(ATTEMPTS)
    .select("ip, created_at")
    .gte("created_at", new Date(Date.now() - RETENTION_MS).toISOString())
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) throw new Error(error.message);

  const byIp = new Map<string, { ip: string; attempts: number; last_attempt_at: string }>();
  for (const row of (data ?? []) as { ip: string; created_at: string }[]) {
    const entry = byIp.get(row.ip);
    if (entry) entry.attempts += 1;
    else byIp.set(row.ip, { ip: row.ip, attempts: 1, last_attempt_at: row.created_at });
  }
  return [...byIp.values()].sort((a, b) => b.attempts - a.attempts);
}

/** Feloldás: a tiltás és a korábbi próbák is törlődnek, tiszta lappal indul. */
export async function unban(supabase: SupabaseClient, ip: string): Promise<void> {
  const { error } = await supabase.from(BANS).delete().eq("ip", ip);
  if (error) throw new Error(error.message);
  await clearFailures(supabase, ip);
}
