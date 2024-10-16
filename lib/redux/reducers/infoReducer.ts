import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { DialogProps, InfoState, OptionProps, SnackProps } from "../store.type";
const initialState: InfoState = {
  dialogs: [],
  options: [],
  snacks: [],
};

const infoReducer = createSlice({
  initialState,
  name: "info",
  reducers: {
    addDialog: (state, action: PayloadAction<DialogProps>) => {
      state.dialogs = [
        ...(state.dialogs || []),
        { dismissable: true, ...action.payload },
      ];
    },
    popDialog: (state) => {
      state.dialogs = state.dialogs.slice(1);
    },
    addSnack: (state, action: PayloadAction<SnackProps>) => {
      state.snacks = [...(state.snacks || []), action.payload];
    },
    popSnack: (state) => {
      state.snacks = state.snacks.slice(1);
    },
    setOptions: (state, action: PayloadAction<OptionProps[]>) => {
      state.options = action.payload;
    },
    clearOptions: (state) => {
      state.options = [];
    },
  },
});

export const {
  addDialog,
  popDialog,
  setOptions,
  clearOptions,
  addSnack,
  popSnack,
} = infoReducer.actions;

export default infoReducer.reducer;
