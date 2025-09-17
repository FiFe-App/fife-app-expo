import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import {
  SearchParams,
  User,
  UsersState,
} from "../store.type";

const initialState: UsersState = {
  users: [],
  userSearchParams: {
    skip: 0,
    text: "",
    loading: false,
    searchCircle: undefined,
    searchType: "map",
  },
};

const usersReducer = createSlice({
  initialState,
  name: "users",
  reducers: {
    storeUsers: (
      state,
      action: PayloadAction<User[]>,
    ) => {
      state.users = action.payload;
    },
    loadUsers: (
      state,
      action: PayloadAction<User[]>,
    ) => {
      state.users = [...state.users, ...action.payload];
    },
    storeUserSearchParams: (
      state,
      action: PayloadAction<Partial<SearchParams>>,
    ) => {
      state.userSearchParams = {
        ...state.userSearchParams,
        ...action.payload,
      };
    },
    storeUserLoading: (state, action: PayloadAction<boolean>) => {
      if (state.userSearchParams)
        state.userSearchParams.loading = action.payload;
    },
    storeUserSearchType: (state, action: PayloadAction<"map" | "list">) => {
      if (state.userSearchParams)
        state.userSearchParams.searchType = action.payload;
    },
    clearUserSearchParams: (state) => {
      state.userSearchParams = {};
    },
  },
});

export const {
  storeUsers,
  loadUsers,
  storeUserSearchParams,
  storeUserSearchType,
  storeUserLoading,
  clearUserSearchParams,
} = usersReducer.actions;

export default usersReducer;
