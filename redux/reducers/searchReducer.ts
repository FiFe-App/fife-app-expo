import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export interface SearchState {
  /**
   * The text being searched, for every kind of search (bizniszek, fifék, kérések): there is one
   * search box and one query at a time. The search screen keeps it in step with its route
   * (/search?q=…), which is what the history steps through.
   */
  text: string;
}

const initialState: SearchState = { text: "" };

const searchReducer = createSlice({
  initialState,
  name: "search",
  reducers: {
    storeSearchText: (state, { payload }: PayloadAction<string>) => {
      state.text = payload;
    },
  },
});

export const { storeSearchText } = searchReducer.actions;
export default searchReducer;
