import { PayloadAction, createSlice } from '@reduxjs/toolkit'
import { UserState } from '../store.type';

const initialState: UserState = {
  uid: undefined,
  name: undefined,
  userData: null,
}

const userReducer = createSlice({
  initialState,
  name: 'user',
  reducers: {
    init: (state:UserState, {payload}:PayloadAction<string>) => {
      if (!state.uid) {
        const uid = payload
        if (uid) state.uid = uid
      }
    },
    login: (state,{ payload }) => {
      state.uid = payload
      console.log('logged in as',payload.toString());
    },
    logout: (state) => {
      console.log('logged out',state);
      return userReducer.getInitialState();
    },
    setUserData: (state,{ payload }) => {
      state.userData = payload;
    },
    setName: (state,{ payload }) => {
      state.name = payload
    }
  }
})

export const { 
  init, login, logout, setName, setUserData
} = userReducer.actions

export default userReducer.reducer