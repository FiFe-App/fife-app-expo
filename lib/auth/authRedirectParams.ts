/**
 * Helpers for the URL fragment Supabase appends when it redirects back into the
 * app after an e-mail link (sign-up confirmation, password recovery).
 *
 * On success the fragment carries the session:
 *   #access_token=...&refresh_token=...&expires_in=3600&type=signup
 *
 * On failure it carries the reason instead, and no tokens at all:
 *   #error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired
 */

export type AuthRedirectParams = Record<string, string>;

/**
 * `decodeURIComponent` on its own leaves the `+` that Supabase uses for spaces
 * in `error_description`. Tokens are base64url (`-` and `_`, never `+`), so
 * treating `+` as a space is safe for every value in this fragment.
 */
const decodeValue = (value: string) => {
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch {
    return value;
  }
};

export const parseAuthRedirectFragment = (
  fragment: string | undefined | null,
): AuthRedirectParams | null => {
  if (!fragment) return null;

  const entries = fragment
    .replace(/^#/, "")
    .split("&")
    .filter(Boolean)
    .map((pair) => {
      // Split on the *first* `=` only, so a value containing one survives.
      const separator = pair.indexOf("=");
      return separator === -1
        ? ([decodeValue(pair), ""] as const)
        : ([decodeValue(pair.slice(0, separator)), decodeValue(pair.slice(separator + 1))] as const);
    });

  return entries.length ? Object.fromEntries(entries) : null;
};

export const getAuthRedirectTokens = (params: AuthRedirectParams | null) => {
  if (!params?.access_token || !params?.refresh_token) return null;
  return { access_token: params.access_token, refresh_token: params.refresh_token };
};

// Wording stays neutral between "confirm your e-mail" and "reset your
// password" — both flows land here with the same codes.
const EXPIRED = "Ez a link lejárt, vagy már felhasználtad. Kérj egy újat!";

const MESSAGES: Record<string, string> = {
  otp_expired: EXPIRED,
  access_denied: EXPIRED,
};

/** The reason Supabase refused the link, in Hungarian where we have wording for it. */
export const describeAuthRedirectError = (params: AuthRedirectParams | null) => {
  if (!params) return null;

  const code = params.error_code || params.error;
  if (!code) return null;

  return MESSAGES[code] ?? params.error_description ?? code;
};
