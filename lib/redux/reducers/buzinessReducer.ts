import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import {
  BuzinessItemInterface,
  BuzinessSearchParams,
  BuzinessState,
} from "../store.type";

const initialState: BuzinessState = {
  buzinesses: [],
  buzinessSearchParams: undefined,
};

const buzinessReducer = createSlice({
  initialState,
  name: "buziness",
  reducers: {
    storeBuzinesses: (
      state,
      action: PayloadAction<BuzinessItemInterface[]>,
    ) => {
      state.buzinesses = action.payload;
    },
    storeBuzinessearchParams: (
      state,
      action: PayloadAction<BuzinessSearchParams>,
    ) => {
      state.buzinessSearchParams = { ...action.payload };
    },
    editBuziness: (
      state,
      { payload }: PayloadAction<BuzinessItemInterface>,
    ) => {
      state.buzinesses = state.buzinesses.map((buziness) =>
        buziness.id === payload.id ? { ...buziness, ...payload } : buziness,
      );
    },
    deleteBuziness: (state, { payload }: PayloadAction<number>) => {
      state.buzinesses = state.buzinesses.filter(
        (buziness) => buziness.id !== payload,
      );
    },
    clearBuziness: (state: BuzinessState) => {
      state.buzinesses = [];
    },
  },
});

export const { storeBuzinesses, storeBuzinessearchParams, clearBuziness } =
  buzinessReducer.actions;

export default buzinessReducer.reducer;
