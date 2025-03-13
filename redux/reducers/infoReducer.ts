import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import {
  DialogProps,
  InfoState,
  LoadingProps,
  OptionProps,
  SnackProps,
} from "../store.type";
const initialState: InfoState = {
  dialogs: [],
  options: [],
  snacks: [],
  loading: undefined,
  notificationToken: null,
};

const infoReducer = createSlice({
  initialState,
  name: "info",
  reducers: {
    setNotificationToken: (
      state,
      action: PayloadAction<string | null | undefined>,
    ) => {
      state.notificationToken = action.payload;
    },
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
    updateOption: (state, action: PayloadAction<Partial<OptionProps>>) => {
      console.log("update", action.payload);

      let toUpdate = state.options.findIndex(
        (opt) => opt.title === action.payload.title,
      );
      state.options[toUpdate] = {
        ...state.options[toUpdate],
        ...action.payload,
      };
    },
    clearOptions: (state) => {
      state.options = [];
    },
    showLoading: (state, action: PayloadAction<LoadingProps>) => {
      state.loading = action.payload;
    },
    hideLoading: (state) => {
      state.loading = undefined;
    },
  },
});

export const {
  setNotificationToken,
  addDialog,
  popDialog,
  setOptions,
  updateOption,
  clearOptions,
  addSnack,
  popSnack,
  showLoading,
  hideLoading,
} = infoReducer.actions;

export default infoReducer.reducer;
