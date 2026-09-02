import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { NotificationPrefs, SearchMode, TaskItem, UserSettingsPayload, UserState } from "../store.type";
import { DEFAULT_THEME_PREFERENCE } from "@/assets/theme";

type SearchHistoryKey = "previousSearches" | "previousProfileSearches";

/** Newest first, deduped, per list. */
const MAX_PREVIOUS_SEARCHES = 10;

/**
 * The two searches keep separate histories — a fife's name must never surface
 * as a biznisz suggestion, and vice versa.
 */
const searchHistoryKey = (mode: SearchMode): SearchHistoryKey =>
  mode === "fife" ? "previousProfileSearches" : "previousSearches";

const initialState: UserState = {
  uid: undefined,
  name: undefined,
  // Left unset (not false) until the real value is fetched — the "does the
  // other side have messaging on" checks elsewhere treat unset the same as
  // off, but NotificationPrompts specifically needs to tell "off" from
  // "not checked yet" so it doesn't nudge someone who already has it on.
  messagingEnabled: undefined,
  userData: null,
  locationError: null,
  themePreference: DEFAULT_THEME_PREFERENCE,
  savedBuzinesses: [],
  previousSearches: [],
  previousProfileSearches: [],
  inviteCardDismissed: false,
  isItSafeDismissed: false,
};

const userReducer = createSlice({
  initialState,
  name: "user",
  reducers: {
    init: (state: UserState, { payload }: PayloadAction<string>) => {
      if (!state.uid) {
        const uid = payload;
        if (uid) state.uid = uid;
      }
    },
    login: (state, { payload }) => {
      state.uid = payload;
      console.log("logged in as", payload.toString());
    },
    logout: (state) => {
      state = initialState;
      return initialState;
    },
    setUserData: (state, { payload }) => {
      state.userData = { ...state.userData, ...payload };
    },
    setName: (state, { payload }) => {
      state.name = payload;
    },
    setMessagingEnabled: (state, { payload }: PayloadAction<boolean>) => {
      state.messagingEnabled = payload;
    },
    setMantra: (state, { payload }: PayloadAction<string>) => {
      state.mantra = payload;
    },
    addTask: (state, { payload }: PayloadAction<TaskItem>) => {
      state.tasks = [...(state.tasks ?? []), payload];
    },
    toggleTask: (state, { payload }: PayloadAction<string>) => {
      state.tasks = (state.tasks ?? []).map((task) =>
        task.id === payload ? { ...task, checked: !task.checked } : task,
      );
    },
    setLocationError: (state, { payload }: PayloadAction<string | null>) => {
      state.locationError = payload;
    },
    setThemePreference: (state, { payload }: PayloadAction<"light" | "dark" | "auto">) => {
      state.themePreference = payload;
    },
    addSavedBuziness: (state, { payload }: PayloadAction<number>) => {
      if (!state.savedBuzinesses) state.savedBuzinesses = [];
      if (!state.savedBuzinesses.includes(payload)) {
        state.savedBuzinesses = [...state.savedBuzinesses, payload];
      }
    },
    removeSavedBuziness: (state, { payload }: PayloadAction<number>) => {
      if (!state.savedBuzinesses) state.savedBuzinesses = [];
      state.savedBuzinesses = state.savedBuzinesses.filter((id) => id !== payload);
    },
    dismissInviteCard: (state) => {
      state.inviteCardDismissed = true;
    },
    dismissedIsItSafe: (state) => {
      state.isItSafeDismissed = true;
    },
    // null clears the stored location (the user deleted it in the profile editor)
    setLocation: (state, { payload }: PayloadAction<{ latitude: number; longitude: number; radius: number } | null>) => {
      if (!state.userData) {
        if (!payload) return;
        state.userData = {
          authorization: "",
          email: "",
          emailVerified: false,
          providerData: {},
          createdAt: new Date(),
          lastLoginAt: new Date(),
        };
      }
      state.userData.location = payload
        ? {
          lat: payload.latitude,
          lng: payload.longitude,
          radius: payload.radius,
        }
        : undefined;
    },
    setNotificationPrefs: (state, { payload }: PayloadAction<NotificationPrefs>) => {
      state.notificationPrefs = payload;
    },
    patchNotificationPrefs: (state, { payload }: PayloadAction<Partial<NotificationPrefs>>) => {
      if (!state.notificationPrefs) return;
      state.notificationPrefs = { ...state.notificationPrefs, ...payload };
    },
    addPreviousSearch: (
      state,
      { payload }: PayloadAction<{ query: string; mode: SearchMode }>,
    ) => {
      const { query, mode } = payload;
      if (!query.trim()) return;
      const key = searchHistoryKey(mode);
      // redux-persist rehydrates slices written before either key existed, so
      // the list can genuinely be missing however the type reads.
      const list = state[key] ?? [];
      state[key] = [query, ...list.filter((s) => s !== query)].slice(
        0,
        MAX_PREVIOUS_SEARCHES,
      );
    },
    removeFromPreviousSearches: (
      state,
      { payload }: PayloadAction<{ query: string; mode: SearchMode }>,
    ) => {
      const key = searchHistoryKey(payload.mode);
      state[key] = (state[key] ?? []).filter((s) => s !== payload.query);
    },
    /**
     * Applies a user_settings row fetched from the server, replacing the local
     * values wholesale. Sync is last-write-wins at row granularity, so this is
     * only dispatched when the server copy is the one that should win — see
     * hooks/useUserSettings.ts.
     */
    hydrateSettings: (
      state,
      { payload }: PayloadAction<{ settings: UserSettingsPayload; syncedAt: string }>,
    ) => {
      const { settings } = payload;
      state.mantra = settings.mantra;
      state.tasks = settings.tasks;
      state.previousSearches = settings.previousSearches;
      state.previousProfileSearches = settings.previousProfileSearches;
      state.themePreference = settings.themePreference;
      state.savedBuzinesses = settings.savedBuzinesses;
      state.isItSafeDismissed = settings.isItSafeDismissed;
      state.inviteCardDismissed = settings.inviteCardDismissed;
      state.settingsSyncedAt = payload.syncedAt;
    },
    /** Records that the local state has been successfully pushed to the server. */
    markSettingsSynced: (state, { payload }: PayloadAction<string>) => {
      state.settingsSyncedAt = payload;
    },
  },
});

export const {
  init,
  login,
  logout,
  setName,
  setMessagingEnabled,
  setMantra,
  addTask,
  toggleTask,
  setUserData,
  setLocationError,
  setThemePreference,
  addSavedBuziness,
  removeSavedBuziness,
  setLocation,
  setNotificationPrefs,
  patchNotificationPrefs,
  dismissInviteCard,
  addPreviousSearch,
  removeFromPreviousSearches,
  dismissedIsItSafe,
  hydrateSettings,
  markSettingsSynced
} = userReducer.actions;

export default userReducer;
