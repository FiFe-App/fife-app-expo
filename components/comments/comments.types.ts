import { StyleProp, ViewStyle } from "react-native";
import { Tables } from "./../../database.types";
export interface CommentsProps {
  path: string;
  placeholder: string;
  limit?: number;
  style?: StyleProp<ViewStyle>;
  /**
   * Signed-out visitors: the comments to show, already loaded. anon cannot
   * read the comments table, so nothing is queried or subscribed to.
   */
  publicComments?: Comment[];
  /**
   * Read-only: the comments stay visible (and reportable / deletable by their authors) but the
   * input is replaced by `closedText`. Used under a solved request.
   */
  closed?: boolean;
  closedText?: string;
}

export interface Comment extends Tables<"comments"> {
  profiles: {
    full_name: string | null;
  } | null;
}
