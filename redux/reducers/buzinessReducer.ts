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
    loading: false,
    searchCircle: undefined,
    searchType: "map",
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
      action: PayloadAction<Partial<BuzinessSearchParams>>,
    ) => {
      state.buzinessSearchParams = {
        ...state.buzinessSearchParams,
        ...action.payload,
      };
    },
    storeBuzinessLoading: (state, action: PayloadAction<boolean>) => {
      if (state.buzinessSearchParams)
        state.buzinessSearchParams.loading = action.payload;
    },
    storeBuzinessSearchType: (state, action: PayloadAction<"map" | "list">) => {
      if (state.buzinessSearchParams)
        state.buzinessSearchParams.searchType = action.payload;
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
  storeBuzinessSearchType,
  storeBuzinessLoading,
  clearBuzinessSearchParams,
} = buzinessReducer.actions;

export default buzinessReducer;
