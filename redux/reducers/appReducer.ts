import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { logout } from "./userReducer";

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
  // This state is per-account and persisted, so without a reset the next
  // person to sign in on the same device inherits the previous user's
  // dismissals. Handled here rather than as another clear action dispatched
  // at each sign-out: there are five of those call sites and they already
  // disagree about what they clear, so one that got missed would leak.
  extraReducers: (builder) => builder.addCase(logout, () => initialState),
});

export const { dismissHomeAddBuzinessCard, setHomeAddBuzinessCardDismissed } =
  appReducer.actions;

export default appReducer;
