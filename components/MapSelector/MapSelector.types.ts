import { CircleType } from "@/redux/store.type";
import { StyleProp, ViewStyle } from "react-native";

export interface MapSelectorProps {
  style?: StyleProp<ViewStyle>;
  searchEnabled: boolean;
  data?: CircleType;
  title?: string;
  text?: string;
  setData?: React.Dispatch<React.SetStateAction<CircleType | undefined>>;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  markerOnly?: boolean
}
