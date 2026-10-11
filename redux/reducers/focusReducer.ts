import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { logout } from "./userReducer";

export interface FocusState {
  /**
   * When the running Pomodoro timer was started (ms epoch), or null when it is
   * stopped. Persisted: the current phase is derived from this alone, so the
   * timer picks up where it is after an app restart, in step with the
   * notifications already scheduled for it.
   */
  startedAt: number | null;
}

const initialState: FocusState = { startedAt: null };

const focusReducer = createSlice({
  initialState,
  name: "focus",
  reducers: {
    startFocus: (state, action: PayloadAction<number>) => {
      state.startedAt = action.payload;
    },
    stopFocus: (state) => {
      state.startedAt = null;
    },
  },
  // A timer is personal — the next account on this device doesn't inherit it.
  extraReducers: (builder) => {
    builder.addCase(logout, (state) => {
      state.startedAt = null;
    });
  },
});

export const { startFocus, stopFocus } = focusReducer.actions;
export default focusReducer;
