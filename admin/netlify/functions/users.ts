import type { Handler } from "@netlify/functions";
import { isAuthenticated } from "./_lib/auth";
import { getSupabaseAdmin } from "./_lib/supabase";

const PAGE_SIZE = 50;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(statusCode: number, body: unknown) {
  return { statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

// A badBoy szűrő három állású: "true" / "false" csak azokat, bármi más mindenkit.
function parseBadBoy(value: string | undefined): boolean | null {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

async function list(params: Record<string, string | undefined>) {
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc("admin_list_users", {
    p_search: (params.search ?? "").trim() || null,
    p_bad_boy: parseBadBoy(params.badBoy),
    p_reported: params.reported === "true",
    p_limit: PAGE_SIZE,
    p_offset: (page - 1) * PAGE_SIZE,
  });

  if (error) return json(500, { error: error.message });

  const rows = (data ?? []) as { total_count: number }[];
  return json(200, {
    users: rows.map(({ total_count: _total, ...user }) => user),
    total: rows[0]?.total_count ?? 0,
    page,
    pageSize: PAGE_SIZE,
  });
}

// A badboy állapot átállítása. A service role megkerüli az RLS-t, így ehhez
// nem kell külön adatbázis-függvény.
async function setBadBoy(body: string | null) {
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(body || "{}");
  } catch {
    return json(400, { error: "Érvénytelen kérés." });
  }

  const id = typeof payload.id === "string" ? payload.id : "";
  if (!UUID_RE.test(id) || typeof payload.badBoy !== "boolean") {
    return json(400, { error: "Hiányzó vagy érvénytelen felhasználó / badBoy érték." });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .update({ bad_boy: payload.badBoy })
    .eq("id", id)
    .select("id, bad_boy")
    .maybeSingle();

  if (error) return json(500, { error: error.message });
  if (!data) return json(404, { error: "Ennek a felhasználónak nincs profilja." });
  return json(200, { id: data.id, bad_boy: data.bad_boy });
}

export const handler: Handler = async (event) => {
  if (!isAuthenticated(event.headers.cookie)) {
    return json(401, { error: "Nincs bejelentkezve." });
  }

  try {
    if (event.httpMethod === "GET") return await list(event.queryStringParameters ?? {});
    if (event.httpMethod === "PATCH") return await setBadBoy(event.body);
    return { statusCode: 405, body: "Method Not Allowed" };
  } catch (err) {
    return json(500, { error: err instanceof Error ? err.message : "Ismeretlen szerverhiba." });
  }
};
