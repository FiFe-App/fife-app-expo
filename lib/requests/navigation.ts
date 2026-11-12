import { router } from "expo-router";

/**
 * Where the requests are listed: the Kérések tab of the search screen. `browse` keeps it quiet
 * (no keyboard) when the user did not come to type anything.
 */
export const REQUESTS_HREF = {
  pathname: "/search",
  params: { mode: "kerelem", browse: "1" },
} as const;

/** Leaves a request that is gone (deleted, blocked author, not found): back to the list. */
export const leaveRequest = () => {
  if (router.canGoBack()) router.back();
  else router.replace(REQUESTS_HREF);
};
