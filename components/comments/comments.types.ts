import { Tables } from "./../../database.types";
export interface CommentsProps {
  path: string;
  placeholder: string;
  limit?: number;
}

export type Comment = Tables<"comments">;
