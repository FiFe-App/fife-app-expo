import type { Handler } from "@netlify/functions";
import { isAuthenticated } from "./_lib/auth";
import { getSupabaseAdmin } from "./_lib/supabase";

const SELECT_COLUMNS =
  "id, created_at, subject, title, cta_label, cta_url, recipients, status, sent_count, failed_count, error, sent_at";

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

async function list() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("newsletters")
    .select(SELECT_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ newsletters: data }),
  };
}

// Insert azonnal kiküldi a hírlevelet (lásd on_newsletter_created trigger),
// ezért itt validálunk mindent, mielőtt beírnánk a sort.
async function create(body: string | null) {
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Érvénytelen kérés." }) };
  }

  const subject = str(payload.subject);
  const bodyHtml = str(payload.body);
  const title = str(payload.title) || null;
  const ctaLabel = str(payload.ctaLabel) || null;
  const ctaUrl = str(payload.ctaUrl) || null;
  const testEmail = str(payload.testEmail);

  if (!subject || !bodyHtml) {
    return { statusCode: 400, body: JSON.stringify({ error: "A tárgy és a tartalom megadása kötelező." }) };
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("newsletters")
    .insert({
      subject,
      title,
      body: bodyHtml,
      cta_label: ctaLabel,
      cta_url: ctaUrl,
      recipients: testEmail ? [testEmail] : null,
    })
    .select(SELECT_COLUMNS)
    .single();

  if (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ newsletter: data }),
  };
}

export const handler: Handler = async (event) => {
  if (!isAuthenticated(event.headers.cookie)) {
    return { statusCode: 401, body: JSON.stringify({ error: "Nincs bejelentkezve." }) };
  }

  if (event.httpMethod === "GET") return list();
  if (event.httpMethod === "POST") return create(event.body);
  return { statusCode: 405, body: "Method Not Allowed" };
};
