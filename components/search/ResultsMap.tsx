import MyLocationIcon from "@/assets/images/myLocationIcon";
import { useMyLocation } from "@/hooks/useMyLocation";
import { useRef, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Button } from "react-native-paper";
import FiFeMap from "../mapView/FiFeMap";
import { MapBottom, MapControls } from "../mapView/MapControls";
import { Camera, Marker, type Region } from "../mapView/mapView";

interface ResultsMapProps {
  /** The pins: <Marker>s. */
  children?: ReactNode;
  /** A tap on the bare map: the selection ends. */
  onBackgroundPress?: () => void;
  /** The list / map switch, shown in the map's column of buttons. */
  viewSwitch?: ReactNode;
  /** The card of the picked pin: it takes the bottom of the map. */
  card?: ReactNode;
  /** Without a picked pin the bottom holds "search around here": it is told where the map is. */
  onSearchHere?: (center: { latitude: number; longitude: number }) => void;
  searchHereLoading?: boolean;
}

/**
 * The map view of the fifék and the kérések, laid out like the bizniszek's: the map fills the
 * screen, one column of buttons sits at the top right, and the bottom holds the card of the
 * picked pin, or the "search around here" button. There is no list.
 */
export const ResultsMap = ({
  children,
  onBackgroundPress,
  viewSwitch,
  card,
  onSearchHere,
  searchHereLoading,
}: ResultsMapProps) => {
  const { myLocation } = useMyLocation();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  const regionRef = useRef<Region | null>(null);

  const panToMyLocation = () => {
    if (!mapRef.current || !myLocation) return;
    mapRef.current.animateToRegion(
      {
        latitude: myLocation.coords.latitude,
        longitude: myLocation.coords.longitude,
        latitudeDelta: 0.0043,
        longitudeDelta: 0.0034,
      },
      1000,
    );
  };

  const zoom = (by: number) => {
    mapRef.current?.getCamera().then((cam: Camera) => {
      if (cam.zoom) cam.zoom += by;
      mapRef.current?.animateCamera(cam);
    });
  };

  return (
    <View testID="results-map" style={styles.container}>
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
      <MapControls
        located={!!myLocation}
        onLocate={panToMyLocation}
        onZoom={zoom}
        viewSwitch={viewSwitch}
      />
      <MapBottom>
        {card ? (
          <View style={{ width: "100%" }}>{card}</View>
        ) : (
          onSearchHere && (
            <Button
              testID="map-search-here"
              mode="contained-tonal"
              loading={searchHereLoading}
              onPress={() => {
                const region = regionRef.current;
                const center = region
                  ? { latitude: region.latitude, longitude: region.longitude }
                  : myLocation?.coords;
                if (center) onSearchHere(center);
              }}
            >
              Keress ezen a környéken
            </Button>
          )
        )}
      </MapBottom>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
});

export default ResultsMap;
