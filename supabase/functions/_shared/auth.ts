// Shared authentication helpers for edge functions.
//
// Important: the gateway's JWT check is satisfied by the *anon* key, which ships
// inside the published app and is therefore public. Any function that must only
// be reachable by the database (triggers/webhooks) or by an operator has to
// verify the caller itself — that is what isServiceRoleRequest is for.

/** Constant-time comparison so a wrong guess can't be narrowed down by timing. */
function timingSafeEqual(a: string, b: string): boolean {
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  if (aBytes.length !== bBytes.length) return false;
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) diff |= aBytes[i] ^ bBytes[i];
  return diff === 0;
}

/** Extracts the bearer token from the Authorization header, or null. */
export function getBearerToken(req: Request): string | null {
  const header = req.headers.get("Authorization");
  if (!header || !header.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

/**
 * True only when the caller presented the service role key — i.e. a database
 * trigger, a webhook, or an operator. Never true for a request that carries
 * only the public anon key or an end-user JWT.
 */
export function isServiceRoleRequest(req: Request, serviceRoleKey: string): boolean {
  if (!serviceRoleKey) return false;
  const token = getBearerToken(req);
  if (!token) return false;
  return timingSafeEqual(token, serviceRoleKey);
}
