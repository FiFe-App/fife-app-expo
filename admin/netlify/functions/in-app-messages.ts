import type { Handler } from "@netlify/functions";
import { isAuthenticated } from "./_lib/auth";
import { getSupabaseAdmin } from "./_lib/supabase";

const SELECT_COLUMNS =
  "id, created_at, icon, open_icon, title, body, primary_label, primary_url, secondary_label, secondary_url";

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

function json(statusCode: number, body: unknown) {
  return { statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

// Az app mindig a legújabb sort mutatja, ezért ez csak azt adja vissza.
async function latest() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("in_app_messages")
    .select(SELECT_COLUMNS)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return json(500, { error: error.message });
  return json(200, { message: data });
}

// Mentés = új sor, sosem update: a régi változatok megmaradnak, és az app az
// új id-ből tudja, hogy ezt még nem látta a felhasználó — automatikusan
// felugrik mindenkinek.
async function create(body: string | null) {
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(body || "{}");
  } catch {
    return json(400, { error: "Érvénytelen kérés." });
  }

  const title = str(payload.title);
  const text = str(payload.body);
  if (!title || !text) {
    return json(400, { error: "A cím és a szöveg megadása kötelező." });
  }

  const row = {
    icon: str(payload.icon),
    open_icon: str(payload.openIcon),
    title,
    body: text,
    primary_label: str(payload.primaryLabel),
    primary_url: str(payload.primaryUrl),
    secondary_label: str(payload.secondaryLabel),
    secondary_url: str(payload.secondaryUrl),
  };

  // Félig kitöltött gomb az appban egyszerűen nem jelenne meg — inkább itt
  // szóljunk, mint hogy csendben eltűnjön.
  for (const [label, url, name] of [
    [row.primary_label, row.primary_url, "Első"],
    [row.secondary_label, row.secondary_url, "Második"],
  ] as const) {
    if (!!label !== !!url) {
      return json(400, { error: `${name} gomb: a szöveg és a link csak együtt adható meg.` });
    }
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("in_app_messages")
    .insert(row)
    .select(SELECT_COLUMNS)
    .single();

  if (error) return json(500, { error: error.message });
  return json(200, { message: data });
}

export const handler: Handler = async (event) => {
  if (!isAuthenticated(event.headers.cookie)) {
    return json(401, { error: "Nincs bejelentkezve." });
  }

  try {
    if (event.httpMethod === "GET") return await latest();
    if (event.httpMethod === "POST") return await create(event.body);
    return { statusCode: 405, body: "Method Not Allowed" };
  } catch (err) {
    return json(500, { error: err instanceof Error ? err.message : "Ismeretlen szerverhiba." });
  }
};
