import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export interface RequestsState {
  /** What the kérések search box last submitted; empty = the plain feed. */
  searchText: string;
}

const initialState: RequestsState = {
  searchText: "",
};

const requestsReducer = createSlice({
  initialState,
  name: "requests",
  reducers: {
    storeRequestSearchText: (state, { payload }: PayloadAction<string>) => {
      state.searchText = payload;
    },
  },
});

export const { storeRequestSearchText } = requestsReducer.actions;
export default requestsReducer;
