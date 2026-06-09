import { StyleProp, ViewStyle } from "react-native";
import { Tables } from "./../../database.types";
export interface CommentsProps {
  path: string;
  placeholder: string;
  limit?: number;
  style?: StyleProp<ViewStyle>;
}

export interface Comment extends Tables<"comments"> {
  profiles: {
    full_name: string | null;
  } | null;
}
