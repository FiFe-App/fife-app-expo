import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { TaskItem, UserState } from "../store.type";
import { DEFAULT_THEME_PREFERENCE } from "@/assets/theme";

const initialState: UserState = {
  uid: undefined,
  name: undefined,
  messagingEnabled: false,
  userData: null,
  locationError: null,
  themePreference: DEFAULT_THEME_PREFERENCE,
  savedBuzinesses: [],
  previousSearches: [],
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
    setNotificationPrefs: (state, { payload }: PayloadAction<{ notifyPush: boolean; notifyEmail: boolean; newsletter: boolean; emotionDailyPrompt: boolean }>) => {
      state.notificationPrefs = payload;
    },
    addPreviousSearch: (state, { payload }: PayloadAction<string>) => {
      if (!payload.trim()) return;
      if (!state.previousSearches) state.previousSearches = [];
      state.previousSearches = [
        payload,
        ...state.previousSearches.filter((s) => s !== payload),
      ].slice(0, 10);
    },
    removeFromPreviousSearches: (state, { payload }: PayloadAction<string>) => {
      if (!state.previousSearches) return;
      state.previousSearches = state.previousSearches.filter((s) => s !== payload);
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
  dismissInviteCard,
  addPreviousSearch,
  removeFromPreviousSearches,
  dismissedIsItSafe
} = userReducer.actions;

export default userReducer;
