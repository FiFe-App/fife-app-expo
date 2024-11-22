import { supabase } from "@/lib/supabase/supabase";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { TutorialState } from "../store.type";

const initialState: TutorialState = {
  functions: [
    "buzinessPage",
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
    viewFunction: (
      state,
      action: PayloadAction<{ key: string; uid: string }>,
    ) => {
      const index = state.functions.indexOf(action.payload.key);

      if (index > -1) {
        console.log("viewFunction");
        supabase
          .from("profiles")
          .update({
            viewed_functions: state.functions.filter(
              (x) => x !== action.payload.key,
            ),
          })
          .eq("id", action.payload.uid)
          .then((res) => {
            console.log(res);
          });
        state.functions.splice(index, 1);
      }
    },
    loadViewedFunctions: (state, action: PayloadAction<string[]>) => {
      state.functions = state.functions.filter((x) =>
        action.payload.includes(x),
      );
    },
    clearTutorialState: (state) => {
      console.log("state", tutorialReducer.getInitialState());
      state.functions = tutorialReducer.getInitialState().functions;
    },
  },
});

export const { viewFunction, loadViewedFunctions, clearTutorialState } =
  tutorialReducer.actions;

export default tutorialReducer;
