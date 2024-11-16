import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { TutorialState } from "../store.type";

const initialState: TutorialState = {
  functions: [
    "bizniszPage",
    "profilPage",
    "buzinessProfile",
    "contactsProfile",
    "friendsProfile",
  ],
};

const tutorialReducer = createSlice({
  initialState,
  name: "info",
  reducers: {
    viewFunction: (state, action: PayloadAction<string>) => {
      const index = state.functions.indexOf(action.payload);
      console.log("viewFunc", index);

      if (index > -1) {
        state.functions.splice(index, 1);
      }
    },
  },
});

export const { viewFunction } = tutorialReducer.actions;

export default tutorialReducer.reducer;
