import type { Handler } from "@netlify/functions";
import { isAuthenticated } from "./_lib/auth";
import { getSupabaseAdmin } from "./_lib/supabase";

const SELECT_COLUMNS =
  "id, created_at, subject, title, cta_label, cta_url, recipients, audience, status, sent_count, failed_count, error, sent_at";

type Audience = "subscribers" | "all";

// A kliensből érkező érték sosem kerül közvetlenül az adatbázisba: csak a két
// ismert értéket engedjük át, minden más a szűkebb (feliratkozók) ágra esik.
function parseAudience(value: unknown): Audience {
  return value === "all" ? "all" : "subscribers";
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

// Hány címzettet érintene a kiküldés? A NewsletterForm ezt mutatja a küldés
// gomb mellett — a 19-es hírlevél azért ment ki hat embernek, mert senki nem
// látta előre, milyen kicsi a feliratkozói lista.
//
// A sorokat itt számoljuk meg ahelyett, hogy a PostgREST count=exact/head
// változatát használnánk: a head-es hívás query stringbe teszi a paramétereket,
// ahol a NULL tömb (p_emails) nem egyértelműen kódolható.
async function count(audience: Audience) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc("get_newsletter_recipients", {
    p_emails: null,
    p_audience: audience,
  });

  if (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ count: (data ?? []).length }),
  };
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
  // Teszt küldésnél a recipients nyer a resolverben, így az audience úgyis
  // figyelmen kívül marad — 'subscribers'-ként tároljuk, hogy a lista ne
  // mutasson félrevezető "MINDENKI" címkét egy teszt soron.
  const audience: Audience = testEmail ? "subscribers" : parseAudience(payload.audience);

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
      audience,
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

  try {
    // A `return await` itt nem felesleges: `return list()` esetén a promise a
    // try blokkon kívül dőlne el, így az alábbi catch sosem futna le.
    if (event.httpMethod === "GET") {
      const requested = event.queryStringParameters?.count;
      if (requested) return await count(parseAudience(requested));
      return await list();
    }
    if (event.httpMethod === "POST") return await create(event.body);
    return { statusCode: 405, body: "Method Not Allowed" };
  } catch (err) {
    // getSupabaseAdmin() dob, ha az env változók hiányoznak. Kezeletlenül ez
    // Netlify-oldali HTML hibaoldal lenne JSON helyett, amit a kliens csak
    // "Ismeretlen hiba"-ként tud megjeleníteni — pedig pontos oka van.
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: err instanceof Error ? err.message : "Ismeretlen szerverhiba.",
      }),
    };
  }
};
