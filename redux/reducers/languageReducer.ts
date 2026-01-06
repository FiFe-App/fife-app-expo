import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface LanguageState {
  language: "en" | "hu";
}

const initialState: LanguageState = {
  language: "hu",
};

const languageSlice = createSlice({
  name: "language",
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<"en" | "hu">) => {
      state.language = action.payload;
    },
  },
});

export const { setLanguage } = languageSlice.actions;
export default languageSlice;
