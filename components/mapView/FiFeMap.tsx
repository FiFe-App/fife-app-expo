import React, { forwardRef } from "react";
import { Platform } from "react-native";
import  { useAppTheme } from "@/assets/theme";
import { Camera, MapView } from "./mapView";
import { darkMapStyle, lightMapStyle } from "../MapSelector/mapStyles";

type MapViewProps = React.ComponentProps<typeof MapView>;

export type FiFeMapProps = Omit<MapViewProps, "initialCamera"> & {
  initialCamera?: Partial<Camera>;
};

const DEFAULT_CENTER = {
  latitude: 47.4979,
  longitude: 19.0402,
};

const FiFeMap = forwardRef<MapView, FiFeMapProps>(
  ({ initialCamera, customMapStyle, children, ...props }, ref) => {
    const theme = useAppTheme();
    const isDarkTheme = theme.dark;
    const mapStyle = customMapStyle ?? (isDarkTheme ? darkMapStyle : lightMapStyle);

    const platformProps = Platform.OS === "web"
      ? {
          options: {
            mapTypeControl: false,
            fullscreenControl: false,
            streetViewControl: false,
            zoomControl: false,
            ...((props as Record<string, unknown>).options as object),
          },
          googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        }
      : {};

    return (
      <MapView
        ref={ref}
        {...platformProps as any}
        initialCamera={{
          altitude: 10,
          center: initialCamera?.center ?? DEFAULT_CENTER,
          heading: 0,
          pitch: 0,
          zoom: 12,
          ...initialCamera,
        }}
        provider="google"
        pitchEnabled={false}
        rotateEnabled={false}
        toolbarEnabled={false}
        customMapStyle={mapStyle}
        {...props}
      >
        {children}
      </MapView>
    );
  }
);

FiFeMap.displayName = "FiFeMap";

export default FiFeMap;
