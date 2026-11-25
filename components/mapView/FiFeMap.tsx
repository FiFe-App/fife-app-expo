import React, { forwardRef } from "react";
import { Platform } from "react-native";
import  { useAppTheme } from "@/assets/theme";
import { Camera, MapView } from "./mapView";
import { useAppMode } from "@/lib/mode/appMode";
import { mapStyleFor } from "../MapSelector/mapStyles";

type MapViewProps = React.ComponentProps<typeof MapView>;

export type FiFeMapProps = Omit<MapViewProps, "initialCamera"> & {
  initialCamera?: Partial<Camera>;
};

const DEFAULT_CENTER = {
  latitude: 47.4979,
  longitude: 19.0402,
};

/**
 * iOS draws Apple Maps unless a Google Maps key for iOS is configured (EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS,
 * see app.config.js): only Google Maps can wear the app's purple / cream style.
 */
const IOS_HAS_GOOGLE_MAPS = !!process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_IOS;
const useAppleMaps = Platform.OS === "ios" && !IOS_HAS_GOOGLE_MAPS;

const FiFeMap = forwardRef<MapView, FiFeMapProps>(
  ({ initialCamera, customMapStyle, children, ...props }, ref) => {
    const theme = useAppTheme();
    const isDarkTheme = theme.dark;
    // The map wears the side of the app it is on: cream for Én, lavender for Mi.
    const appMode = useAppMode();
    const mapStyle = customMapStyle ?? mapStyleFor(appMode, isDarkTheme);

    const platformProps = Platform.OS === "web"
      ? {
          options: {
            mapTypeControl: false,
            fullscreenControl: false,
            streetViewControl: false,
            zoomControl: false,
            ...((props as Record<string, unknown>).options as object),
          },
          googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY_WEB,
        }
      : {};

    return (
      <MapView
        ref={ref}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {...(platformProps as any)}
        initialCamera={{
          // Apple Maps reads the camera's altitude (metres above the ground) and ignores `zoom`,
          // Google Maps the other way round. 10 m, as this used to say, is a street corner on
          // Apple Maps: ~12 km is the city this zoom 12 shows on Google Maps.
          altitude: 12000,
          center: initialCamera?.center ?? DEFAULT_CENTER,
          heading: 0,
          pitch: 0,
          zoom: 12,
          ...initialCamera,
        }}
        provider={useAppleMaps ? undefined : "google"}
        // Apple Maps cannot take a custom style (that is Google's), so it is at least muted and
        // follows the light / dark theme.
        {...(useAppleMaps
          ? { mapType: "mutedStandard" as const, userInterfaceStyle: isDarkTheme ? "dark" : "light" }
          : {})}
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
