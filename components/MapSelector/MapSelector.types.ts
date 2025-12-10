import { Circle } from "@/redux/store.type";
import { StyleProp, ViewStyle } from "react-native";

export interface MapSelectorProps {
  style?: StyleProp<ViewStyle>;
  searchEnabled: boolean;
  data?: Circle;
  title?: string;
  text?: string;
  setData?: React.Dispatch<React.SetStateAction<Circle | undefined>>;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  markerOnly?: boolean
}
