import { StyleProp, ViewStyle } from "react-native";
import { LatLng } from "react-native-maps";

export interface MapLocationType {
  location: LatLng;
}

export interface MapSelectorProps {
  style?: StyleProp<ViewStyle>;
  searchEnabled: boolean;
  data?: MapLocationType;
  title?: string;
  text?: string;
  setData?: React.Dispatch<React.SetStateAction<MapLocationType | undefined>>;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}
