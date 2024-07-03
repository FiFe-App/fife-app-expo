import { Comment } from "@/components/Comments/comments.types";

export interface UserState {
    uid?: string,
    name?: string,
    userData?: any,
}
export interface CommentsState {
    comments: Comment[];
}