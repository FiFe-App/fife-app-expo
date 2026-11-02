import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export interface RequestsState {
  /** What the kérések search box last submitted; empty = the plain feed. */
  searchText: string;
  /**
   * The "Új kérés" bottom sheet. It lives here, not in a screen, because several screens open
   * it (the community strip, the list, the search) and it is mounted once, at the root.
   */
  composer: { open: boolean; initialTitle: string };
}

const initialState: RequestsState = {
  searchText: "",
  composer: { open: false, initialTitle: "" },
};

const requestsReducer = createSlice({
  initialState,
  name: "requests",
  reducers: {
    storeRequestSearchText: (state, { payload }: PayloadAction<string>) => {
      state.searchText = payload;
    },
    /** Opens the sheet, optionally with the title already typed (e.g. from a search). */
    openRequestComposer: (state, { payload }: PayloadAction<string | undefined>) => {
      state.composer = { open: true, initialTitle: (payload ?? "").trim() };
    },
    closeRequestComposer: (state) => {
      state.composer = { open: false, initialTitle: "" };
    },
  },
});

export const { storeRequestSearchText, openRequestComposer, closeRequestComposer } =
  requestsReducer.actions;
export default requestsReducer;
