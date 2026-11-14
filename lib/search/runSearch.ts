import type { Dispatch } from "@reduxjs/toolkit";
import { router } from "expo-router";

import { storeBuzinesses, storeBuzinessSearchParams } from "@/redux/reducers/buzinessReducer";
import { storeUserSearchParams } from "@/redux/reducers/usersReducer";
import { addPreviousSearch } from "@/redux/reducers/userReducer";
import type { SearchMode } from "@/redux/store.type";

/**
 * Runs a biznisz or fife search the way the search screen does: records it in
 * that mode's history, stores the query and opens the results. Returns false
 * (and does nothing) for an empty query.
 *
 * `how` is "replace" from the search screen itself, so Back skips it, and
 * "navigate" from anywhere else, so Back returns to where the user came from.
 */
export const runSearch = (
  dispatch: Dispatch,
  query: string,
  mode: SearchMode,
  how: "replace" | "navigate" = "replace",
): boolean => {
  const trimmed = query.trim();
  if (!trimmed) return false;
  dispatch(addPreviousSearch({ query: trimmed, mode }));
  const go = how === "replace" ? router.replace : router.navigate;
  if (mode === "fife") {
    dispatch(storeUserSearchParams({ text: trimmed, skip: 0 }));
    go("/fifeRadar");
    return true;
  }
  dispatch(storeBuzinessSearchParams({ text: trimmed }));
  dispatch(storeBuzinesses([]));
  go("/biznisz");
  return true;
};
