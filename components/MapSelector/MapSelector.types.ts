import { StyleProp, ViewStyle } from "react-native";
import { LatLng } from "react-native-maps";

export interface MapCircleType {
  location: LatLng;
  radius: number;
}

export interface MapSelectorProps {
  style?: StyleProp<ViewStyle>;
  searchEnabled: boolean;
  data?: MapCircleType;
  setData?: React.Dispatch<React.SetStateAction<MapCircleType | undefined>>;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}
