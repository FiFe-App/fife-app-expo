import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { UserState } from "../store.type";
import { DEFAULT_THEME_PREFERENCE } from "@/assets/theme";

const initialState: UserState = {
  uid: undefined,
  name: undefined,
  userData: null,
  locationError: null,
  themePreference: DEFAULT_THEME_PREFERENCE,
  savedBuzinesses: [],
  previousSearches: [],
  locationAlertDismissed: false,
  inviteCardDismissed: false,
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
    setNotificationPrefs: (state, { payload }: PayloadAction<{ notifyPush: boolean; notifyEmail: boolean; newsletter: boolean }>) => {
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
