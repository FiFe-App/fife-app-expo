import { useLinkingURL } from "expo-linking";
import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";

import { parseAuthRedirectFragment } from "@/lib/auth/authRedirectParams";

/**
 * The params Supabase puts in the URL fragment when it redirects back into the
 * app after an e-mail link (sign-up confirmation, password recovery).
 *
 * `useLocalSearchParams()["#"]` is not enough on its own. expo-router rebuilds a
 * native deep link's path from host + pathname + query only
 * (`fork/extractPathFromURL.ts`), so on Android and iOS the fragment — and with
 * it the whole session — is dropped before it can reach the route params. Only
 * the web build keeps it, because there the path comes straight from
 * `window.location`. The raw launch URL still carries the fragment on every
 * platform, so read that first and fall back to the route param.
 */
export const useAuthRedirectParams = () => {
  const routerHash = useLocalSearchParams<{ "#"?: string }>()["#"];
  const linkingUrl = useLinkingURL();

  return useMemo(() => {
    const separator = linkingUrl?.indexOf("#") ?? -1;
    const fragment = separator >= 0 ? linkingUrl?.slice(separator + 1) : undefined;

    return parseAuthRedirectFragment(fragment || routerHash);
  }, [linkingUrl, routerHash]);
};
