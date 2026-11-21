import type { RequestScope } from "@/lib/requests/types";
import type { SearchMode } from "@/redux/store.type";

const CATEGORY: Record<SearchMode, string> = {
  biznisz: "bizniszek",
  fife: "fifék",
  kerelem: "kérések",
};

const REQUEST_SCOPE_TITLE: Record<RequestScope, string> = {
  all: "Új kérések",
  for_me: "Kérések neked",
  mine: "Saját kérések",
  solved: "Megoldott kérések",
};

const REQUEST_SCOPE_FILTER: Record<RequestScope, string | null> = {
  all: null,
  for_me: "neked",
  mine: "saját",
  solved: "megoldott",
};

interface TitleInput {
  mode: SearchMode;
  q?: string;
  scope?: RequestScope;
  ingyen?: boolean;
  /** A place was picked in the filter. */
  hasCircle?: boolean;
}

export interface SearchTitle {
  /** The line above the list. */
  title: string;
  /** What the filter narrowed ("ingyenes", "kiválasztott helyen"), for a smaller line under it. */
  filters: string[];
}

/**
 * The text above the list. Without a query it names what the category lists by default (new
 * bizniszek, the FiFe Radar, the kérések for you); with one it says what is being searched
 * ("Találatok a kérések között: kert"). Whatever the filter narrowed comes apart from it, as a
 * line of its own.
 */
export function searchTitle({ mode, q, scope = "for_me", ingyen, hasCircle }: TitleInput): SearchTitle {
  const query = q?.trim();
  const filters: string[] = [];
  if (mode === "biznisz" && ingyen) filters.push("ingyenes");
  if (mode === "kerelem" && query) {
    const slice = REQUEST_SCOPE_FILTER[scope];
    if (slice) filters.push(slice);
  }
  if (mode !== "kerelem" && hasCircle) filters.push("kiválasztott helyen");

  const title = query
    ? `Találatok a ${CATEGORY[mode]} között: ${query}`
    : mode === "biznisz"
      ? "Új bizniszek"
      : mode === "fife"
        ? "FiFe Radar"
        : REQUEST_SCOPE_TITLE[scope];
  return { title, filters };
}
