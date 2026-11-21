import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export interface RequestsState {
  /**
   * The "Új kérés" modal. It lives here, not in a screen, because several screens open it (the
   * community screen's prompt, the search lists) and it is mounted once, at the root.
   */
  composer: { open: boolean; initialTitle: string };
}

const initialState: RequestsState = {
  composer: { open: false, initialTitle: "" },
};

const requestsReducer = createSlice({
  initialState,
  name: "requests",
  reducers: {
    /** Opens the modal, optionally with the title already typed (e.g. from a search). */
    openRequestComposer: (state, { payload }: PayloadAction<string | undefined>) => {
      state.composer = { open: true, initialTitle: (payload ?? "").trim() };
    },
    closeRequestComposer: (state) => {
      state.composer = { open: false, initialTitle: "" };
    },
  },
});

export const { openRequestComposer, closeRequestComposer } = requestsReducer.actions;
export default requestsReducer;
