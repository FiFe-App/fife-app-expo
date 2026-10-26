import { PayloadAction, createSlice } from "@reduxjs/toolkit";

import { CircleType } from "@/redux/store.type";

/**
 * A biznisz being written, as the editor holds it. Media is deliberately
 * absent: those are files on the device with their own upload flow, and a path
 * that survives into the next app run may not point at anything any more.
 */
export interface BuzinessDraft {
  title: string;
  description: string;
  categories: string[];
  ingyen: boolean;
  isPublic: boolean;
  circle: CircleType | null;
  defaultContact: number | null;
  /** ISO timestamp of the last keystroke, so a stale draft can be recognised. */
  savedAt: string;
}

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
  /**
   * The members-only page a visitor was turned away from before they signed
   * in or registered — see lib/auth/loginRedirect.ts. Here rather than in the
   * user slice for the same reason as `invitedBy`: it belongs to somebody who
   * has no account yet, and it has to survive the app restart that confirming
   * the e-mail address causes. Cleared the moment it is used.
   */
  redirectAfterAuth: string | null;
  /**
   * Unsaved biznisz editors, keyed by what is being edited: the row's id, or
   * "new" for one that does not exist yet. Android kills a backgrounded app
   * whenever it needs the memory, and everything typed into a form went with
   * it — so the editor writes here as the user types and reads it back when
   * it opens. Cleared when the biznisz is saved, or thrown away by hand.
   */
  buzinessDrafts: Record<string, BuzinessDraft>;
  /**
   * The last screen the user was actually on, and when. Restored on the next
   * cold start so a kill in the background does not put them back at the
   * beginning — see hooks/useLastRoute.ts.
   */
  lastRoute: { path: string; at: string } | null;
}

const initialState: AppState = {
  homeAddBuzinessCardDismissed: false,
  homeMessagingCardDismissed: false,
  invitedBy: null,
  signupDraft: { name: "", username: "", email: "", acceptConditions: false },
  redirectAfterAuth: null,
  buzinessDrafts: {},
  lastRoute: null,
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
    /** A locked link sent this visitor to sign in or register; this is the page. */
    setRedirectAfterAuth: (state, { payload }: PayloadAction<string>) => {
      state.redirectAfterAuth = payload;
    },
    /** Used, or no longer relevant — it is good for one arrival. */
    clearRedirectAfterAuth: (state) => {
      state.redirectAfterAuth = null;
    },
    /** The editor's current contents, written as the user types. */
    setBuzinessDraft: (
      state,
      { payload }: PayloadAction<{ key: string; draft: BuzinessDraft }>,
    ) => {
      // Rebuilt rather than mutated: a store persisted before this field
      // existed rehydrates without it (redux-persist replaces each slice
      // wholesale instead of deep-merging the new defaults in).
      state.buzinessDrafts = {
        ...(state.buzinessDrafts ?? {}),
        [payload.key]: payload.draft,
      };
    },
    /** Saved, or discarded by the user — either way there is nothing to restore. */
    clearBuzinessDraft: (state, { payload }: PayloadAction<string>) => {
      const drafts = { ...(state.buzinessDrafts ?? {}) };
      delete drafts[payload];
      state.buzinessDrafts = drafts;
    },
    /** Where the user is right now, remembered for the next cold start. */
    setLastRoute: (state, { payload }: PayloadAction<{ path: string; at: string }>) => {
      state.lastRoute = payload;
    },
    clearLastRoute: (state) => {
      state.lastRoute = null;
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
  setRedirectAfterAuth,
  clearRedirectAfterAuth,
  setBuzinessDraft,
  clearBuzinessDraft,
  setLastRoute,
  clearLastRoute,
} = appReducer.actions;

export default appReducer;
