import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export interface AppState {
  homeAddBuzinessCardDismissed: boolean;
  homeMessagingCardDismissed: boolean;
  /**
   * The uid of the member whose invite link brought this visitor here — see
   * app/meghivo/[uid].tsx. It lives here rather than in the user slice
   * because it belongs to somebody who is not signed in yet, and logging out
   * resets that slice wholesale. Persisted with the rest of the store, so it
   * survives the app restart the confirmation e-mail causes, and is cleared
   * once the invitation has been recorded.
   */
  invitedBy: string | null;
}

const initialState: AppState = {
  homeAddBuzinessCardDismissed: false,
  homeMessagingCardDismissed: false,
  invitedBy: null,
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
    /** The visitor opened somebody's invite link and tapped "Csatlakozom". */
    setInvitedBy: (state, { payload }: PayloadAction<string>) => {
      state.invitedBy = payload;
    },
    /** The invitation has been recorded (or the invite is not usable any more). */
    clearInvitedBy: (state) => {
      state.invitedBy = null;
    },
  },
});

export const {
  dismissHomeAddBuzinessCard,
  setHomeAddBuzinessCardDismissed,
  dismissHomeMessagingCard,
  setHomeMessagingCardDismissed,
  setInvitedBy,
  clearInvitedBy,
} = appReducer.actions;

export default appReducer;
