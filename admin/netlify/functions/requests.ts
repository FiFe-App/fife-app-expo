import type { Handler } from "@netlify/functions";
import { isAuthenticated } from "./_lib/auth";
import { getSupabaseAdmin } from "./_lib/supabase";

const PAGE_SIZE = 50;
const MAX_PAGE = 10_000;

function json(statusCode: number, body: unknown) {
  return { statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

// Csak a két ismert állapot jut el az adatbázisig; bármi más = mindkettő.
function parseStatus(value: string | undefined): "open" | "solved" | null {
  return value === "open" || value === "solved" ? value : null;
}

export const handler: Handler = async (event) => {
  if (!isAuthenticated(event.headers.cookie)) {
    return json(401, { error: "Nincs bejelentkezve." });
  }
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const params = event.queryStringParameters ?? {};
    const page = Math.min(MAX_PAGE, Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1));

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.rpc("admin_list_requests", {
      p_search: (params.search ?? "").trim() || null,
      p_reported: params.reported === "true",
      p_status: parseStatus(params.status),
      p_limit: PAGE_SIZE,
      p_offset: (page - 1) * PAGE_SIZE,
    });

    if (error) return json(500, { error: error.message });

    const rows = (data ?? []) as { total_count: number }[];
    return json(200, {
      requests: rows.map(({ total_count: _total, ...request }) => request),
      total: rows[0]?.total_count ?? 0,
      page,
      pageSize: PAGE_SIZE,
    });
  } catch (err) {
    return json(500, { error: err instanceof Error ? err.message : "Ismeretlen szerverhiba." });
  }
};
