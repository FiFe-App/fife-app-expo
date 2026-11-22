import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export type SearchView = "list" | "map";

export interface SearchState {
  /**
   * The text being searched, for every kind of search (bizniszek, fifék, kérések): there is one
   * search box and one query at a time. The search screen keeps it in step with its route
   * (/search?q=…), which is what the history steps through.
   */
  text: string;
  /** List or map: one switch for every tab of the search screen. */
  view: SearchView;
}

const initialState: SearchState = { text: "", view: "list" };

const searchReducer = createSlice({
  initialState,
  name: "search",
  reducers: {
    storeSearchText: (state, { payload }: PayloadAction<string>) => {
      state.text = payload;
    },
    storeSearchView: (state, { payload }: PayloadAction<SearchView>) => {
      state.view = payload;
    },
  },
});

export const { storeSearchText, storeSearchView } = searchReducer.actions;
export default searchReducer;
