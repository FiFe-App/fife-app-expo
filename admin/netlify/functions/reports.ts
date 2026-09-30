import type { Handler } from "@netlify/functions";
import { isAuthenticated } from "./_lib/auth";
import { getSupabaseAdmin } from "./_lib/supabase";

const PAGE_SIZE = 50;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(statusCode: number, body: unknown) {
  return { statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
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
    const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
    const reportedId = params.reportedId && UUID_RE.test(params.reportedId) ? params.reportedId : null;

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.rpc("admin_list_reports", {
      p_reported_id: reportedId,
      p_reason: (params.reason ?? "").trim() || null,
      p_limit: PAGE_SIZE,
      p_offset: (page - 1) * PAGE_SIZE,
    });

    if (error) return json(500, { error: error.message });

    const rows = (data ?? []) as { total_count: number }[];
    return json(200, {
      reports: rows.map(({ total_count: _total, ...report }) => report),
      total: rows[0]?.total_count ?? 0,
      page,
      pageSize: PAGE_SIZE,
    });
  } catch (err) {
    return json(500, { error: err instanceof Error ? err.message : "Ismeretlen szerverhiba." });
  }
};
