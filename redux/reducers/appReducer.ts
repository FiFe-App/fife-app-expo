import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export interface AppState {
  homeAddBuzinessCardDismissed: boolean;
}

const initialState: AppState = {
  homeAddBuzinessCardDismissed: false,
};

const appReducer = createSlice({
  initialState,
  name: "app",
  reducers: {
    dismissHomeAddBuzinessCard: (state) => {
      state.homeAddBuzinessCardDismissed = true;
    },
  },
});

export const { dismissHomeAddBuzinessCard } = appReducer.actions;

export default appReducer;
