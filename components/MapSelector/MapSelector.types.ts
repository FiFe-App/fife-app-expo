import { StyleProp, ViewStyle } from "react-native";
import { LatLng } from "react-native-maps";

export interface MapCircleType {
    position: LatLng,
    radius: number,
    radiusDisplay: string|null,
}

export interface MapSelectorProps {
    style?: StyleProp<ViewStyle>;
    searchEnabled: boolean;
    data?: MapCircleType;
    setData?: React.Dispatch<React.SetStateAction<MapCircleType|undefined>>;
}