import { Tables } from "./../../../database.types";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { CommentsState } from "../store.type";

const initialState: CommentsState = {
  comments: [],
};
type Comment = Tables<"comments">;

const commentsReducer = createSlice({
  initialState,
  name: "comments",
  reducers: {
    addComment: (state, action: PayloadAction<Comment>) => {
      state.comments.unshift(action.payload);
    },
    addComments: (state, action: PayloadAction<Comment[]>) => {
      state.comments.unshift(...action.payload);
    },
    editComment: (state, { payload }: PayloadAction<Comment>) => {
      state.comments = state.comments.map((comment) =>
        comment.id === payload.id ? { ...comment, ...payload } : comment,
      );
    },
    deleteComment: (state, { payload }: PayloadAction<number>) => {
      state.comments = state.comments.filter(
        (comment) => comment.id !== payload,
      );
    },
    clearComments: (state: CommentsState) => {
      state.comments = [];
    },
  },
});

export const {
  addComment,
  addComments,
  editComment,
  deleteComment,
  clearComments,
} = commentsReducer.actions;

export default commentsReducer.reducer;
