import { supabase } from "@/lib/supabase/supabase";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { LayoutRectangle, TutorialState } from "../store.type";

const initialState: TutorialState = {
  functions: [
    "buzinessPage",
    "profilPage",
    "buzinessProfile",
    "contactsProfile",
    "friendsProfile",
  ],
  tutorialStep: 0,
  isTutorialActive: true,
  tutorialLayouts: {},
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
    setTutorialActive(state, action: PayloadAction<boolean>) {
      state.isTutorialActive = action.payload;
    },
    setTutorialStep(state, action: PayloadAction<number>) {
      state.tutorialStep = action.payload;
    },
    specifyTutorialStepLayout(state, action: PayloadAction<{layout:LayoutRectangle,key:string}>) {
      if (state.tutorialLayouts)
        state.tutorialLayouts[action.payload.key] = action.payload.layout;
    },
  },
});

export const { viewFunction, loadViewedFunctions, clearTutorialState, setTutorialActive, setTutorialStep, specifyTutorialStepLayout } =
  tutorialReducer.actions;

export default tutorialReducer;
