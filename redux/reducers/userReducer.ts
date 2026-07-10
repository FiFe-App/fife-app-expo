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
  locationAlertDismissed: false,
  inviteCardDismissed: false,
  mainTaskNotificationEnabled: true,
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
    reorderTasks: (state, { payload }: PayloadAction<TaskItem[]>) => {
      // payload is the new order of the currently visible tasks; any tasks
      // not included (hidden-at-mount, already-completed ones) keep their
      // relative order and stay appended after the reordered visible ones.
      const reorderedIds = new Set(payload.map((task) => task.id));
      const rest = (state.tasks ?? []).filter((task) => !reorderedIds.has(task.id));
      state.tasks = [...payload, ...rest];
    },
    setMainTaskNotificationEnabled: (state, { payload }: PayloadAction<boolean>) => {
      state.mainTaskNotificationEnabled = payload;
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
    dismissLocationAlert: (state) => {
      state.locationAlertDismissed = true;
    },
    dismissInviteCard: (state) => {
      state.inviteCardDismissed = true;
    },
    setLocation: (state, { payload }: PayloadAction<{ latitude: number; longitude: number; radius: number }>) => {
      if (!state.userData) {
        state.userData = {
          authorization: "",
          email: "",
          emailVerified: false,
          providerData: {},
          createdAt: new Date(),
          lastLoginAt: new Date(),
        };
      }
      state.userData.location = {
        lat: payload.latitude,
        lng: payload.longitude,
        radius: payload.radius,
      };
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
  reorderTasks,
  setMainTaskNotificationEnabled,
  setUserData,
  setLocationError,
  setThemePreference,
  addSavedBuziness,
  removeSavedBuziness,
  setLocation,
  setNotificationPrefs,
  dismissLocationAlert,
  dismissInviteCard,
  addPreviousSearch,
  removeFromPreviousSearches,
} = userReducer.actions;

export default userReducer;
