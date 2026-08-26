import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export interface AppState {
  homeAddBuzinessCardDismissed: boolean;
  homeMessagingCardDismissed: boolean;
}

const initialState: AppState = {
  homeAddBuzinessCardDismissed: false,
  homeMessagingCardDismissed: false,
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
    dismissHomeMessagingCard: (state) => {
      state.homeMessagingCardDismissed = true;
    },
    /** Applied from the server's user_settings row — see hooks/useUserSettings.ts. */
    setHomeMessagingCardDismissed: (state, { payload }: PayloadAction<boolean>) => {
      state.homeMessagingCardDismissed = payload;
    },
  },
});

export const {
  dismissHomeAddBuzinessCard,
  setHomeAddBuzinessCardDismissed,
  dismissHomeMessagingCard,
  setHomeMessagingCardDismissed,
} = appReducer.actions;

export default appReducer;
