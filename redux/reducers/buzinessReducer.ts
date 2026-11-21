import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import {
  BuzinessSearchItemInterface,
  SearchParams,
  BuzinessState,
} from "../store.type";

const initialState: BuzinessState = {
  buzinesses: [],
  searchParams: {
    skip: 0,
    loading: false,
    searchCircle: undefined,
  },
  hasMore: true,
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
    storeBuzinessHasMore: (state, { payload }: PayloadAction<boolean>) => {
      state.hasMore = payload;
    },
    loadBuzinesses: (
      state,
      action: PayloadAction<BuzinessSearchItemInterface[]>,
    ) => {
      state.buzinesses = [...(state.buzinesses ?? []), ...action.payload];
    },
    storeBuzinessSearchParams: (
      state,
      action: PayloadAction<Partial<SearchParams>>,
    ) => {
      state.searchParams = {
        ...state.searchParams,
        ...action.payload,
      };
    },
    storeBuzinessLoading: (state, action: PayloadAction<boolean>) => {
      if (state.searchParams)
        state.searchParams.loading = action.payload;
    },
    clearBuzinessSearchParams: (state) => {
      state.searchParams = {};
    },
    editBuziness: (
      state,
      { payload }: PayloadAction<BuzinessSearchItemInterface>,
    ) => {
      state.buzinesses = (state.buzinesses ?? []).map((buziness) =>
        buziness.id === payload.id ? { ...buziness, ...payload } : buziness,
      );
    },
    deleteBuziness: (state, { payload }: PayloadAction<number>) => {
      state.buzinesses = (state.buzinesses ?? []).filter(
        (buziness) => buziness.id !== payload,
      );
    },
    removeTrailingDivider: (state) => {
      const list = state.buzinesses ?? [];
      if (list.length > 0 && list[list.length - 1].id === -1) {
        state.buzinesses = list.slice(0, -1);
      }
    },
    clearBuziness: (state: BuzinessState) => {
      state.buzinesses = [];
    },
  },
});

export const {
  storeBuzinesses,
  storeBuzinessHasMore,
  loadBuzinesses,
  removeTrailingDivider,
  clearBuziness,
  storeBuzinessSearchParams,
  storeBuzinessLoading,
  clearBuzinessSearchParams,
} = buzinessReducer.actions;

export default buzinessReducer;
