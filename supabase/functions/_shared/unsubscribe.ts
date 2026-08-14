// Stateless unsubscribe links for the newsletter.
//
// The link carries the recipient's address plus an HMAC-SHA256 of that address,
// so no per-recipient token has to be stored — and an address can't be
// unsubscribed by anyone who hasn't received a mail for it.
//
// Key: NEWSLETTER_SECRET if set, otherwise the service role key (never leaves
// the edge runtime, and the HMAC does not reveal it).

const KEY_SOURCE = Deno.env.get("NEWSLETTER_SECRET") ||
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const FUNCTIONS_BASE_URL = (
  Deno.env.get("FUNCTIONS_BASE_URL") ||
  `${Deno.env.get("SUPABASE_URL") || Deno.env.get("EXPO_PUBLIC_SUPABASE_URL") || ""}/functions/v1`
).replace(/\/+$/, "");

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

let keyPromise: Promise<CryptoKey> | null = null;

function hmacKey(): Promise<CryptoKey> {
  if (!keyPromise) {
    keyPromise = crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(KEY_SOURCE),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
  }
  return keyPromise;
}

export async function unsubscribeToken(email: string): Promise<string> {
  const signature = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(),
    new TextEncoder().encode(normalizeEmail(email)),
  );
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Constant-time comparison — never short-circuit on the first differing byte. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function verifyUnsubscribeToken(
  email: string,
  token: string,
): Promise<boolean> {
  if (!KEY_SOURCE || !email || !token) return false;
  return timingSafeEqual(await unsubscribeToken(email), token.toLowerCase());
}

export async function unsubscribeUrl(email: string): Promise<string> {
  const normalized = normalizeEmail(email);
  const token = await unsubscribeToken(normalized);
  const params = new URLSearchParams({ email: normalized, token });
  return `${FUNCTIONS_BASE_URL}/newsletter-unsubscribe?${params.toString()}`;
}
