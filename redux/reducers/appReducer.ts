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
    /** Applied from the server's user_settings row — see hooks/useUserSettings.ts. */
    setHomeAddBuzinessCardDismissed: (state, { payload }: PayloadAction<boolean>) => {
      state.homeAddBuzinessCardDismissed = payload;
    },
  },
});

export const { dismissHomeAddBuzinessCard, setHomeAddBuzinessCardDismissed } =
  appReducer.actions;

export default appReducer;
