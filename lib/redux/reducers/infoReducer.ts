import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { DialogProps, InfoState } from "../store.type";
const initialState: InfoState = {
  dialogs: [],
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
  },
});

export const { addDialog, popDialog } = infoReducer.actions;

export default infoReducer.reducer;
