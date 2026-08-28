import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ChatState {
  drafts: Record<string, string>;
  lastReadAt: Record<string, string>;
  unreadCounts: Record<string, number>;
}

const initialState: ChatState = {
  drafts: {},
  lastReadAt: {},
  unreadCounts: {},
};

const chatReducer = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setDraftMessage: (
      state,
      action: PayloadAction<{ chatId: string; draft: string }>,
    ) => {
      state.drafts[action.payload.chatId] = action.payload.draft;
    },
    clearDraftMessage: (state, action: PayloadAction<{ chatId: string }>) => {
      delete state.drafts[action.payload.chatId];
    },
    clearDrafts: (state) => {
      state.drafts = {};
    },
    setLastReadAt: (
      state,
      action: PayloadAction<{ chatId: string; lastReadAt: string }>,
    ) => {
      state.lastReadAt[action.payload.chatId] = action.payload.lastReadAt;
      state.unreadCounts[action.payload.chatId] = 0;
    },
    setUnreadCount: (
      state,
      action: PayloadAction<{ chatId: string; count: number }>,
    ) => {
      state.unreadCounts[action.payload.chatId] = action.payload.count;
    },
    setUnreadCounts: (
      state,
      action: PayloadAction<Record<string, number>>,
    ) => {
      state.unreadCounts = action.payload;
    },
    incrementUnreadCount: (
      state,
      action: PayloadAction<{ chatId: string; delta?: number }>,
    ) => {
      const delta = action.payload.delta ?? 1;
      state.unreadCounts[action.payload.chatId] =
        (state.unreadCounts[action.payload.chatId] || 0) + delta;
    },
    /**
     * Merges a lastReadAt map pulled from public.user_settings into the local
     * one, keeping the later timestamp per chat. A plain overwrite could
     * regress a chat that was read locally after the last successful push
     * (e.g. read while offline) back to "unread" — the one failure mode this
     * sync is meant to fix, not reintroduce.
     */
    hydrateLastReadAt: (state, action: PayloadAction<Record<string, string>>) => {
      for (const [chatId, readAt] of Object.entries(action.payload)) {
        if (!state.lastReadAt[chatId] || readAt > state.lastReadAt[chatId]) {
          state.lastReadAt[chatId] = readAt;
        }
      }
    },
    /** Drops local read state on logout so it can't leak into another account on the same device. */
    clearChatReadState: (state) => {
      state.lastReadAt = {};
      state.unreadCounts = {};
    },
  },
});

export const {
  setDraftMessage,
  clearDraftMessage,
  clearDrafts,
  setLastReadAt,
  setUnreadCount,
  setUnreadCounts,
  incrementUnreadCount,
  hydrateLastReadAt,
  clearChatReadState,
} = chatReducer.actions;

export default chatReducer.reducer;
