import type { Handler } from "@netlify/functions";
import { isAuthenticated } from "./_lib/auth";
import { getSupabaseAdmin } from "./_lib/supabase";

const PAGE_SIZE = 50;
const MAX_PAGE = 10_000;

function json(statusCode: number, body: unknown) {
  return { statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

function parseBody(body: string | null): Record<string, unknown> | null {
  try {
    return JSON.parse(body || "{}");
  } catch {
    return null;
  }
}

function parseId(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : null;
}

// "pending" az alapértelmezés: a fül elsősorban a jóváhagyásra várókhoz kell.
function parseStatus(value: string | undefined): "pending" | "public" | null {
  if (value === "all") return null;
  return value === "public" ? "public" : "pending";
}

async function list(params: Record<string, string | undefined>) {
  const page = Math.min(MAX_PAGE, Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1));
  const supabase = getSupabaseAdmin();
  const [{ data, error }, pending] = await Promise.all([
    supabase.rpc("admin_list_help_contacts", {
      p_status: parseStatus(params.status),
      p_search: (params.search ?? "").trim() || null,
      p_limit: PAGE_SIZE,
      p_offset: (page - 1) * PAGE_SIZE,
    }),
    // A navigációban látszó "várakozik" szám, szűrőtől függetlenül.
    supabase.from("help_contacts").select("id", { count: "exact", head: true }).eq("public", false),
  ]);

  if (error) return json(500, { error: error.message });
  if (pending.error) return json(500, { error: pending.error.message });

  const rows = (data ?? []) as { total_count: number }[];
  return json(200, {
    contacts: rows.map(({ total_count: _total, ...contact }) => contact),
    total: rows[0]?.total_count ?? 0,
    pending: pending.count ?? 0,
    page,
    pageSize: PAGE_SIZE,
  });
}

// Jóváhagyás (public = true) vagy elrejtés (public = false).
async function setPublic(body: string | null) {
  const payload = parseBody(body);
  const id = parseId(payload?.id);
  if (!payload || id === null || typeof payload.public !== "boolean") {
    return json(400, { error: "Hiányzó vagy érvénytelen azonosító / public érték." });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("help_contacts")
    .update({ public: payload.public })
    .eq("id", id)
    .select("id, public")
    .maybeSingle();

  if (error) return json(500, { error: error.message });
  if (!data) return json(404, { error: "Nincs ilyen kontakt." });
  return json(200, data);
}

async function remove(body: string | null) {
  const payload = parseBody(body);
  const id = parseId(payload?.id);
  if (id === null) return json(400, { error: "Hiányzó vagy érvénytelen azonosító." });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("help_contacts").delete().eq("id", id).select("id").maybeSingle();
  if (error) return json(500, { error: error.message });
  if (!data) return json(404, { error: "Nincs ilyen kontakt." });
  return json(200, { ok: true });
}

export const handler: Handler = async (event) => {
  if (!isAuthenticated(event.headers.cookie)) {
    return json(401, { error: "Nincs bejelentkezve." });
  }

  try {
    if (event.httpMethod === "GET") return await list(event.queryStringParameters ?? {});
    if (event.httpMethod === "PATCH") return await setPublic(event.body);
    if (event.httpMethod === "DELETE") return await remove(event.body);
    return { statusCode: 405, body: "Method Not Allowed" };
  } catch (err) {
    return json(500, { error: err instanceof Error ? err.message : "Ismeretlen szerverhiba." });
  }
};
