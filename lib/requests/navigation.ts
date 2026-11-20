import { router } from "expo-router";

import { searchHref } from "@/lib/search/href";

/**
 * Where the requests are listed: the Kérések tab of the search screen, on the "for you" slice.
 */
export const REQUESTS_HREF = searchHref("kerelem", { scope: "for_me" });

/** Leaves a request that is gone (deleted, blocked author, not found): back to the list. */
export const leaveRequest = () => {
  if (router.canGoBack()) router.back();
  else router.replace(REQUESTS_HREF);
};
