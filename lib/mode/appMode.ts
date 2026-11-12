import { usePathname } from "expo-router";

import type { AppMode } from "@/assets/theme";

export type { AppMode };

/**
 * The private side of the app: the user's own home, mood journal, help and
 * this phone's settings.
 * Everything else — community, search, messages, profiles, biznisz — is Mi.
 */
const EN_PATHS = ["/login", "/me", "/user/emotion-history", "/user/get-help", "/beallitasok"] as const;

/** Where the Én/Mi switch lands on each side: that side's first tab. */
export const MODE_HOME: Record<AppMode, "/me" | "/home"> = {
  en: "/me",
  mi: "/home",
};

const normalize = (pathname: string) => {
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
};

/**
 * Which side a route belongs to. Derived from the route alone, so the mode can
 * never disagree with what is on screen, and deep links / push URLs need no
 * extra state to land on the right side.
 */
export const modeForPath = (pathname: string): AppMode => {
  const path = normalize(pathname);
  return EN_PATHS.some((p) => path === p || path.startsWith(`${p}/`)) ? "en" : "mi";
};

export const otherMode = (mode: AppMode): AppMode => (mode === "en" ? "mi" : "en");

export const useAppMode = (): AppMode => modeForPath(usePathname() ?? "/");
