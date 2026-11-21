import MyLocationIcon from "@/assets/images/myLocationIcon";
import { Spacing } from "@/constants/spacing";
import { useMyLocation } from "@/hooks/useMyLocation";
import { useRef, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { FAB, IconButton } from "react-native-paper";
import FiFeMap from "../mapView/FiFeMap";
import { Camera, Marker } from "../mapView/mapView";
import mapStyles from "../mapView/style";

interface ResultsMapProps {
  /** The pins: <Marker>s. */
  children?: ReactNode;
  /** A tap on the bare map: the selection ends. */
  onBackgroundPress?: () => void;
}

/**
 * The map of the search screen's map view (fifék, kérések): the user's own position, zoom
 * buttons and the pins the tab puts on it. Pins select; what is selected is shown at the head
 * of the list under the map.
 */
export const ResultsMap = ({ children, onBackgroundPress }: ResultsMapProps) => {
  const { myLocation } = useMyLocation();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);

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
      <FAB
        style={mapStyles.myLocationButton}
        size="small"
        icon={myLocation ? "map-marker" : "map-marker-question"}
        onPress={panToMyLocation}
      />
      <View pointerEvents="box-none" style={styles.zoom}>
        <IconButton
          icon="plus"
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0, margin: 0 }}
          onPress={() => zoom(1)}
          mode="contained"
        />
        <IconButton
          icon="minus"
          style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, margin: 0 }}
          onPress={() => zoom(-1)}
          mode="contained"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  zoom: { position: "absolute", right: Spacing.sm, bottom: Spacing.sm },
});

export default ResultsMap;
