import MyLocationIcon from "@/assets/images/myLocationIcon";
import { useMyLocation } from "@/hooks/useMyLocation";
import { addSnack } from "@/redux/reducers/infoReducer";
import { useRef, type ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button } from "react-native-paper";
import { useDispatch } from "react-redux";
import FiFeMap from "../mapView/FiFeMap";
import { MapControls, MapOverlay } from "../mapView/MapControls";
import { Camera, Marker, type Region } from "../mapView/mapView";

/** The area the map shows, as "search around here" hands it on. */
export interface MapArea {
  latitude: number;
  longitude: number;
  /** Metres, roughly from the middle to the edge. */
  radius: number;
}

interface SearchMapProps {
  /** The pins: <Marker>s of whichever tab is open. */
  children?: ReactNode;
  /** A tap on the bare map: the selection ends. */
  onBackgroundPress?: () => void;
  /** The quick list item of the picked pin. With it there is no "search around here". */
  card?: ReactNode;
  onSearchHere?: (area: MapArea) => void;
  searchHereLoading?: boolean;
}

/** The smallest a zoom may make the map (degrees of latitude shown): a few dozen metres. */
const MIN_LATITUDE_DELTA = 0.0003;

/**
 * THE map of the search screen: one instance for every tab, which only changes its pins. It
 * fills the space, and over it lies one overlay (MapOverlay): the map buttons at the bottom
 * right and, under them, the card of the picked pin or "Keress ezen a környéken".
 */
export const SearchMap = ({
  children,
  onBackgroundPress,
  card,
  onSearchHere,
  searchHereLoading,
}: SearchMapProps) => {
  const dispatch = useDispatch();
  const { myLocation } = useMyLocation();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  const regionRef = useRef<Region | null>(null);

  const animateTo = (region: Region, duration = 400) => {
    regionRef.current = region;
    mapRef.current?.animateToRegion(region, duration);
  };

  // Zoom works on regions, not on the camera: Apple Maps' camera has no `zoom` (it has an
  // altitude), so the camera route silently did nothing on iOS.
  const zoom = (by: number) => {
    const region = regionRef.current;
    if (region && mapRef.current) {
      const factor = Math.pow(0.5, by);
      animateTo(
        {
          ...region,
          latitudeDelta: Math.max(region.latitudeDelta * factor, MIN_LATITUDE_DELTA),
          longitudeDelta: Math.max(region.longitudeDelta * factor, MIN_LATITUDE_DELTA),
        },
        250,
      );
      return;
    }
    // The map has not reported a region yet: the camera knows its zoom (Google Maps).
    mapRef.current?.getCamera().then((cam: Camera) => {
      if (cam.zoom) cam.zoom += by;
      mapRef.current?.animateCamera(cam);
    });
  };

  // Where the user is: the device's position when it may be asked for (a simulator or a phone
  // without a profile place has no other), the profile's place otherwise.
  const locate = async () => {
    let coords: { latitude: number; longitude: number } | undefined = myLocation?.coords;
    try {
      const Location = await import("expo-location");
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.granted) {
        const position = await Location.getCurrentPositionAsync({});
        coords = position.coords;
      }
    } catch (error) {
      console.log("locate failed", error);
    }
    if (!coords) {
      dispatch(
        addSnack({
          title: "Nem érem el a pozíciódat. Engedélyezd a telefon beállításaiban, vagy add meg a környéked a profilodban.",
        }),
      );
      return;
    }
    animateTo({
      latitude: coords.latitude,
      longitude: coords.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    });
  };

  return (
    <View testID="search-map" style={styles.container}>
      <FiFeMap
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        onPoiClick={() => {
          // no-op: suppress default POI behavior
        }}
        onPress={onBackgroundPress}
        onRegionChangeComplete={(region: Region) => {
          regionRef.current = region;
        }}
        initialCamera={{
          center: {
            latitude: myLocation?.coords.latitude || 47.4979,
            longitude: myLocation?.coords.longitude || 19.0402,
          },
        }}
        showsPointsOfInterests={false}
        showsUserLocation
      >
        {children}
        {myLocation && (
          <Marker
            coordinate={myLocation.coords}
            style={{ justifyContent: "center", alignItems: "center" }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <MyLocationIcon style={{ width: 20, height: 20 }} />
          </Marker>
        )}
      </FiFeMap>
      <MapOverlay controls={<MapControls located={!!myLocation} onLocate={locate} onZoom={zoom} />}>
        {card ? (
          <ScrollView
            testID="map-card"
            style={{ width: "100%", flexGrow: 0 }}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            {card}
          </ScrollView>
        ) : (
          onSearchHere && (
            <Button
              testID="map-search-here"
              mode="contained-tonal"
              loading={searchHereLoading}
              onPress={() => {
                const region = regionRef.current;
                if (region) {
                  onSearchHere({
                    latitude: region.latitude,
                    longitude: region.longitude,
                    radius: region.latitudeDelta * 55660,
                  });
                } else if (myLocation) {
                  onSearchHere({
                    latitude: myLocation.coords.latitude,
                    longitude: myLocation.coords.longitude,
                    radius: 1000,
                  });
                }
              }}
            >
              Keress ezen a környéken
            </Button>
          )
        )}
      </MapOverlay>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
});

export default SearchMap;
