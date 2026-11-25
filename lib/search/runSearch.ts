import type { Dispatch } from "@reduxjs/toolkit";
import { router } from "expo-router";

import { addPreviousSearch } from "@/redux/reducers/userReducer";
import type { SearchMode } from "@/redux/store.type";
import { searchHref } from "./href";

/**
 * Runs a biznisz or fife search the way the search screen does: records it in that mode's
 * history and opens it (see `open`), so Back returns to where the user came from.
 * Returns false (and does nothing) for an empty query.
 *
 * The kérések keep no history, and an empty search is a plain route push the screen makes
 * on its own, so neither goes through here.
 */
export const runSearch = (
  dispatch: Dispatch,
  query: string,
  mode: SearchMode,
  /**
   * How the search is opened. By default as a new /search route (what the rest of the app does);
   * the search screen, which is one screen, passes a function that adds it to its own history.
   */
  open: (mode: SearchMode) => void = (next) => router.push(searchHref(next, { q: query.trim() })),
): boolean => {
  const trimmed = query.trim();
  if (!trimmed || mode === "kerelem") return false;
  dispatch(addPreviousSearch({ query: trimmed, mode }));
  open(mode);
  return true;
};
