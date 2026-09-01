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
  /**
   * Draft of the /csatlakozom/email-regisztracio form, kept so the "Vissza"
   * flow through the join wizard (which mounts a fresh copy of that screen
   * rather than restoring the previous one) doesn't make the visitor retype
   * everything. Deliberately excludes the password fields — those are cheap
   * to retype and shouldn't sit in persisted storage.
   */
  signupDraft: {
    name: string;
    username: string;
    email: string;
    acceptConditions: boolean;
  };
}

const initialState: AppState = {
  homeAddBuzinessCardDismissed: false,
  homeMessagingCardDismissed: false,
  invitedBy: null,
  signupDraft: { name: "", username: "", email: "", acceptConditions: false },
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
    // state.signupDraft can come back `undefined` after rehydrating a store
    // persisted before this field existed — redux-persist's default
    // top-level merge replaces each slice wholesale with the persisted
    // blob rather than deep-merging in new defaults. Rebuild it from
    // initialState in that case instead of assuming it's already an object.
    setSignupDraft: (state, { payload }: PayloadAction<Partial<AppState["signupDraft"]>>) => {
      state.signupDraft = { ...(state.signupDraft ?? initialState.signupDraft), ...payload };
    },
    /** Sign-up succeeded, or the visitor left the join flow — the draft is stale either way. */
    clearSignupDraft: (state) => {
      state.signupDraft = initialState.signupDraft;
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
  setSignupDraft,
  clearSignupDraft,
} = appReducer.actions;

export default appReducer;
