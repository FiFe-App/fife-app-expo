import type { Dispatch } from "@reduxjs/toolkit";
import { router } from "expo-router";

import { addPreviousSearch } from "@/redux/reducers/userReducer";
import type { SearchMode } from "@/redux/store.type";
import { searchHref } from "./href";

/**
 * Runs a biznisz or fife search the way the search screen does: records it in that mode's
 * history and opens it as a new entry of /search, so Back returns to where the user came from.
 * Returns false (and does nothing) for an empty query.
 *
 * The kérések keep no history, and an empty search is a plain route push the screen makes
 * on its own, so neither goes through here.
 */
export const runSearch = (dispatch: Dispatch, query: string, mode: SearchMode): boolean => {
  const trimmed = query.trim();
  if (!trimmed || mode === "kerelem") return false;
  dispatch(addPreviousSearch({ query: trimmed, mode }));
  router.push(searchHref(mode, { q: trimmed }));
  return true;
};
