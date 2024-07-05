import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { CommentsState } from "../store.type";
import { Comment } from "@/components/comments/comments.types";

const initialState: CommentsState = {
  comments: [],
};

const commentsReducer = createSlice({
  initialState,
  name: "comments",
  reducers: {
    addComment: (state, action: PayloadAction<Comment>) => {
      state.comments.unshift(action.payload);
    },
    editComment: (state, { payload }: PayloadAction<Comment>) => {
      state.comments = state.comments.map((comment) =>
        comment.key === payload.key ? { ...comment, ...payload } : comment,
      );
    },
    deleteComment: (state, { payload }: PayloadAction<string>) => {
      state.comments = state.comments.filter(
        (comment) => comment.key !== payload,
      );
    },
    clearComments: (state: CommentsState) => {
      state.comments = [];
    },
  },
});

export const { addComment, editComment, deleteComment, clearComments } =
  commentsReducer.actions;

export default commentsReducer.reducer;
