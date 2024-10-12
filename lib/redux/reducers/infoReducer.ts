import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { DialogProps, InfoState, OptionProps } from "../store.type";
const initialState: InfoState = {
  dialogs: [],
  options: [],
};

const infoReducer = createSlice({
  initialState,
  name: "info",
  reducers: {
    addDialog: (state, action: PayloadAction<DialogProps>) => {
      console.log(state.dialogs);

      state.dialogs = [...(state.dialogs || []), action.payload];
    },
    popDialog: (state) => {
      state.dialogs = state.dialogs.slice(1);
    },
    setOptions: (state, action: PayloadAction<OptionProps[]>) => {
      state.options = action.payload;
    },
    clearOptions: (state) => {
      state.options = [];
    },
  },
});

export const { addDialog, popDialog, setOptions, clearOptions } =
  infoReducer.actions;

export default infoReducer.reducer;
