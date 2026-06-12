import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { EmotionLogLocal, EmotionLogsState } from "../store.type";

const initialState: EmotionLogsState = {
  logs: [],
};

const emotionLogsSlice = createSlice({
  name: "emotionLogs",
  initialState,
  reducers: {
    upsertLog: (
      state,
      { payload }: PayloadAction<{ log_date: string; rate: number; note?: string }>
    ) => {
      const now = new Date().toISOString();
      const existing = state.logs.findIndex((l) => l.log_date === payload.log_date);
      if (existing >= 0) {
        state.logs[existing] = {
          ...state.logs[existing],
          rate: payload.rate,
          note: payload.note,
          synced: false,
          updated_at: now,
        };
      } else {
        state.logs.push({
          log_date: payload.log_date,
          rate: payload.rate,
          note: payload.note,
          synced: false,
          created_at: now,
          updated_at: now,
        });
      }
    },
    markSynced: (state, { payload }: PayloadAction<string>) => {
      const entry = state.logs.find((l) => l.log_date === payload);
      if (entry) entry.synced = true;
    },
    mergeFromServer: (state, { payload }: PayloadAction<EmotionLogLocal[]>) => {
      for (const serverLog of payload) {
        const idx = state.logs.findIndex((l) => l.log_date === serverLog.log_date);
        if (idx >= 0) {
          if (state.logs[idx].synced) {
            state.logs[idx] = { ...serverLog, synced: true };
          }
        } else {
          state.logs.push({ ...serverLog, synced: true });
        }
      }
    },
    clearEmotionLogs: () => initialState,
  },
});

export const { upsertLog, markSynced, mergeFromServer, clearEmotionLogs } =
  emotionLogsSlice.actions;

export default emotionLogsSlice;
