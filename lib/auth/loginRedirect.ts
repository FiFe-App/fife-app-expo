import { Platform } from "react-native";
import * as Linking from "expo-linking";

/**
 * Getting somebody back to the page they were actually after.
 *
 * Most of the app is behind the auth guard in app/_layout.tsx. A signed-out
 * visitor who opens a link to one of those pages — a link a friend sent, a
 * notification, a bookmark — is dropped on the login screen by the router, and
 * the address they came for is gone. That is what this carries: the login
 * screen sends them on to it once they are in.
 *
 * Two ways in, because there are two ways to be turned away:
 *
 *  - The link the app was opened with. The router replaces the URL with
 *    /login before any screen of ours runs, so the address is read here, at
 *    module load, while it is still the one the visitor asked for.
 *  - A link inside the app that the visitor cannot follow yet. Those point at
 *    the login screen themselves, with the target as a parameter — see
 *    `getLoginHref`.
 */

export const REDIRECT_PARAM = "redirected_from";

/**
 * Pages a signed-out visitor is allowed on. Returning to one of these after
 * logging in is never what they meant — /login above all, which would loop.
 */
const PUBLIC_PATHS = [
  /^\/$/,
  /^\/login(\/|$)/,
  /^\/csatlakozom(\/|$)/,
  /^\/meghivo(\/|$)/,
  /^\/leiratkozas(\/|$)/,
  /^\/projekt(\/|$)/,
  /^\/user\/password-reset(\/|$)/,
  /^\/user\/deleted-account(\/|$)/,
  // A public biznisz opens without an account, so being sent there is not a
  // rescue. The page's own "sign in to see this" button passes its address
  // explicitly instead.
  /^\/biznisz\/\d+(\/|$)/,
];

/** Is this a page the visitor had to sign in to reach? */
export const isProtectedPath = (path: string): boolean => {
  if (!path.startsWith("/")) return false;
  const pathname = path.split("?")[0].split("#")[0];
  return !PUBLIC_PATHS.some((pattern) => pattern.test(pathname));
};

/**
 * A target is only ever a path inside this app. Anything that could send the
 * user somewhere else after login — an absolute URL, a protocol-relative one,
 * a custom scheme — is refused rather than trusted.
 */
export const sanitizeRedirectTarget = (value: unknown): string | null => {
  const target = Array.isArray(value) ? value[0] : value;
  if (typeof target !== "string") return null;
  if (!target.startsWith("/") || target.startsWith("//")) return null;
  if (target.includes(":") || target.includes("\\")) return null;
  return target;
};

/**
 * Where the "sign in first" buttons point, carrying the page they came from.
 *
 * Spelled out rather than typed as `Href` so it stays usable in both a `Link`
 * and a `router.push`, which read the typed-routes union differently.
 */
export type LoginHref =
  | "/login"
  | { pathname: "/login"; params: Record<string, string> };

export const getLoginHref = (target?: string | null): LoginHref => {
  const safe = sanitizeRedirectTarget(target);
  return safe
    ? { pathname: "/login", params: { [REDIRECT_PARAM]: safe } }
    : "/login";
};

let attemptedPath: string | null = null;

/**
 * Remembers a locked address the visitor was turned away from. Public pages
 * and anything that isn't an in-app path are ignored, so a stale value can
 * never hijack a later, deliberate visit to the login screen.
 */
export const rememberAttemptedPath = (path: string | null | undefined): void => {
  const safe = sanitizeRedirectTarget(path);
  if (safe && isProtectedPath(safe)) attemptedPath = safe;
};

/** Reads the remembered address and forgets it — it is good for one login. */
export const takeAttemptedPath = (): string | null => {
  const path = attemptedPath;
  attemptedPath = null;
  return path;
};

/** Test seam: `rememberAttemptedPath` skips public paths, this clears outright. */
export const __clearAttemptedPath = () => {
  attemptedPath = null;
};

const pathFromUrl = (url: string): string | null => {
  try {
    const { path, queryParams } = Linking.parse(url);
    if (path === null || path === undefined) return null;
    const query = new URLSearchParams(
      Object.entries(queryParams ?? {}).flatMap(([key, value]) =>
        value === undefined || value === null
          ? []
          : [[key, String(value)] as [string, string]],
      ),
    ).toString();
    const pathname = path.startsWith("/") ? path : `/${path}`;
    return query ? `${pathname}?${query}` : pathname;
  } catch {
    return null;
  }
};

// Runs once, as the bundle loads: on web that is before the router has had a
// chance to rewrite the address, and on native the launch URL of a deep link
// arrives a tick later.
if (Platform.OS === "web") {
  if (typeof window !== "undefined" && window.location) {
    rememberAttemptedPath(window.location.pathname + window.location.search);
  }
} else {
  Linking.getInitialURL()
    .then((url) => {
      if (url) rememberAttemptedPath(pathFromUrl(url));
    })
    .catch(() => {
      // No launch URL to read; the visitor simply opened the app.
    });
}
