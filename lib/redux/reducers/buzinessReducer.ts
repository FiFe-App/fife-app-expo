import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import {
  BuzinessSearchItemInterface,
  BuzinessSearchParams,
  BuzinessState,
} from "../store.type";

const initialState: BuzinessState = {
  buzinesses: [],
  buzinessSearchParams: {
    skip: 0,
    text: "",
  },
};

const buzinessReducer = createSlice({
  initialState,
  name: "buziness",
  reducers: {
    storeBuzinesses: (
      state,
      action: PayloadAction<BuzinessSearchItemInterface[]>,
    ) => {
      state.buzinesses = action.payload;
    },
    loadBuzinesses: (
      state,
      action: PayloadAction<BuzinessSearchItemInterface[]>,
    ) => {
      state.buzinesses = [...state.buzinesses, ...action.payload];
    },
    storeBuzinessSearchParams: (
      state,
      action: PayloadAction<BuzinessSearchParams>,
    ) => {
      state.buzinessSearchParams = {
        ...state.buzinessSearchParams,
        ...action.payload,
      };
    },
    clearBuzinessSearchParams: (state) => {
      state.buzinessSearchParams = {};
    },
    editBuziness: (
      state,
      { payload }: PayloadAction<BuzinessSearchItemInterface>,
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

export const {
  storeBuzinesses,
  loadBuzinesses,
  clearBuziness,
  storeBuzinessSearchParams,
  clearBuzinessSearchParams,
} = buzinessReducer.actions;

export default buzinessReducer.reducer;
