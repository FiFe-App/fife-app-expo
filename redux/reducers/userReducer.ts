import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { UserState } from "../store.type";
import { supabase } from "@/lib/supabase/supabase";

const initialState: UserState = {
  uid: undefined,
  name: undefined,
  userData: null,
  locationError: null,
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
      supabase.auth.signOut().then((error) => {
        console.log(error);
      });
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
  },
});

export const { init, login, logout, setName, setUserData, setLocationError } =
  userReducer.actions;

export default userReducer;
