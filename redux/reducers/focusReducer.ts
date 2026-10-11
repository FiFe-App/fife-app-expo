import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { logout } from "./userReducer";
import { DEFAULT_ROUNDS, MAX_ROUNDS, MIN_ROUNDS } from "@/lib/focus/pomodoro";

export interface FocusState {
  /**
   * When the running Pomodoro timer was started (ms epoch), or null when it is
   * stopped. Persisted: the current phase is derived from this and `rounds`
   * alone, so the timer picks up where it is after an app restart, in step
   * with the notifications already scheduled for it.
   */
  startedAt: number | null;
  /** How many rounds to focus for — also remembered as the next default. */
  rounds: number;
}

const initialState: FocusState = { startedAt: null, rounds: DEFAULT_ROUNDS };

const clampRounds = (n: number) => Math.min(MAX_ROUNDS, Math.max(MIN_ROUNDS, Math.round(n)));

const focusReducer = createSlice({
  initialState,
  name: "focus",
  reducers: {
    setRounds: (state, action: PayloadAction<number>) => {
      if (state.startedAt === null) state.rounds = clampRounds(action.payload);
    },
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

export const { setRounds, startFocus, stopFocus } = focusReducer.actions;
export default focusReducer;
