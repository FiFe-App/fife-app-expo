import type { RequestScope } from "@/lib/requests/types";
import type { SearchMode } from "@/redux/store.type";

/**
 * A search is a route: the mode, the query and (for the kérések) which slice, all in the
 * params of /search. That is what makes the Back button step through the searches, an empty
 * one included.
 */
export const searchHref = (
  mode: SearchMode,
  { q, scope, focus }: { q?: string; scope?: RequestScope; focus?: boolean } = {},
) => ({
  pathname: "/search" as const,
  params: {
    mode,
    ...(q?.trim() ? { q: q.trim() } : {}),
    ...(mode === "kerelem" && scope ? { scope } : {}),
    ...(focus ? { focus: "1" } : {}),
  },
});
