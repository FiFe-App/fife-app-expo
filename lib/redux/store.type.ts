import { Comment } from "@/components/comments/comments.types";
import { Tables } from "@/database.types";

export interface UserState {
  uid?: string;
  name?: string;
  userData?: {
    authorization: string;
    email: string;
    emailVerified: boolean;
    providerData: any;
    createdAt: Date;
    lastLoginAt: Date;
  } | null;
}
export interface CommentsState {
  comments: Comment[];
}
