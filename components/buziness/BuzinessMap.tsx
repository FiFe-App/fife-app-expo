import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
import BuzinessItem from "./BuzinessItem";
import { RootState } from "@/redux/store";
import { useDispatch, useSelector } from "react-redux";
import {
  Camera,
  Details,
  Marker,
  Region,
} from "../mapView/mapView";
import FiFeMap from "../mapView/FiFeMap";
import MyLocationIcon from "@/assets/images/myLocationIcon";
import NewMarkerIcon from "@/assets/images/newMarkerIcon";
import { useMyLocation } from "@/hooks/useMyLocation";
import locationToCoords from "@/lib/functions/locationToCoords";
import { storeBuzinessSearchParams } from "@/redux/reducers/buzinessReducer";
import { Button, FAB, IconButton } from "react-native-paper";
import mapStyles from "../mapView/style";
import { Spacing } from "@/constants/spacing";
import { addDialog } from "@/redux/reducers/infoReducer";

interface BuzinessBuzinessMapProps {
  load: (arg0?: number) => void;
}

export const BuzinessMap: React.FC<BuzinessBuzinessMapProps> = ({ load }) => {
  const dispatch = useDispatch();
  const { buzinesses, searchParams } = useSelector(
    (state: RootState) => state.buziness,
  );

  const skip = searchParams?.skip || 0;
  const loading = searchParams?.loading || false;
  const take = 5;
  const [selectedBuzinessId, setSelectedBuzinessId] = useState<null | number>(
    null,
  );
  const selectedBuziness = buzinesses.find((b) => b.id === selectedBuzinessId);
  const [mapHeight, setMapHeight] = useState<number>(0);
  const [circleRadiusText, setCircleRadiusText] = useState("0 km");
  const mapRef = useRef<any>(null);

  const { myLocation } = useMyLocation();
  const regionChangeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const panToMyLocation = () => {
    if (!myLocation) {
      dispatch(
        addDialog({
          title: "Nem elérhető a pozíciód.",
          text: "Ha szeretnéd, hogy a hozzád közel található bizniszeket látsd, kapcsold be.",
          onSubmit: () => { },
          submitText: "Vettem",
        }),
      );
    }
    if (!mapRef.current || !myLocation) return;
    const region = {
      latitude: myLocation.coords.latitude,
      longitude: myLocation.coords.longitude,
      latitudeDelta: 0.0043,
      longitudeDelta: 0.0034,
    };
    mapRef.current.animateToRegion(region, 1000);
  };

  const panToCoords = (latitude: number, longitude: number) => {
    if (!mapRef.current) return;
    const region = {
      latitude,
      longitude,
      latitudeDelta: 0.0043,
      longitudeDelta: 0.0034,
    };
    mapRef.current.animateToRegion(region, 1000);
  };

  const zoom = (zoomTo: number) => {
    if (!mapRef.current) return;
    mapRef?.current?.getCamera().then((cam: Camera) => {
      if (cam.zoom) cam.zoom += zoomTo;
      mapRef?.current?.animateCamera(cam);
    });
  };

  const onRegionChange = (region: Region, details: Details) => {
    if (regionChangeTimeout.current) clearTimeout(regionChangeTimeout.current);
    regionChangeTimeout.current = setTimeout(() => {
      dispatch(
        storeBuzinessSearchParams({
          searchCircle: {
            location: { latitude: region.latitude, longitude: region.longitude },
            radius: region.latitudeDelta * 55660,
          },
        }),
      );
    }, 300);
  };

  return (
    <View style={styles.container}>
      <FiFeMap
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        onMapLoaded={(e) => {
          //Alert.alert(JSON.stringify(e));
        }}
        onPoiClick={() => {
          // no-op: suppress default POI behavior
        }}
        onMarkerPress={(e) => {
          console.log("marker", e);
        }}
        onPress={() => {
          setSelectedBuzinessId(null);
        }}
        initialCamera={{
          center: {
            latitude: myLocation?.coords.latitude || 47.4979,
            longitude: myLocation?.coords.longitude || 19.0402,
          },
        }}
        showsPointsOfInterests={false}
        showsUserLocation
        onRegionChangeComplete={onRegionChange}
      >
        {buzinesses.map((buziness) => {
          if (buziness?.id < 0 || !buziness.location) return null;

          const cords = locationToCoords(String(buziness.location));
          return (
            <Marker
              coordinate={{ latitude: cords[1], longitude: cords[0] }}
              title={buziness.title.split(" $ ")[0]}
              key={buziness.id}
              anchor={{ x: 0.5, y: 0.5 }}
              zIndex={selectedBuzinessId === buziness.id ? 1 : -10}
            >
              <NewMarkerIcon onPress={() => setSelectedBuzinessId(buziness.id)} />
            </Marker>
          );
        })}

        {myLocation && (
          <Marker
            centerOffset={{ x: 10, y: 10 }}
            coordinate={myLocation?.coords}
            style={{ justifyContent: "center", alignItems: "center" }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <MyLocationIcon style={{ width: 20, height: 20 }} />
          </Marker>
        )}
      </FiFeMap>
      <FAB
        style={mapStyles.myLocationButton}
        icon={myLocation ? "map-marker" : "map-marker-question"}
        onPress={panToMyLocation}
      />
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          bottom: Spacing.sm,
          userSelect: "none",
          width: "100%",
          alignItems: "flex-end",
          flexDirection: "column",
        }}
      >
        <View style={{ padding: Spacing.sm, bottom: Spacing.xxxl }}>
          <IconButton
            icon="plus"
            style={{
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              margin: 0,
            }}
            onPress={() => zoom(1)}
            mode="contained"
          />
          <IconButton
            icon="minus"
            style={{
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
              margin: 0,
            }}
            onPress={() => zoom(-1)}
            mode="contained"
          />
        </View>
        {selectedBuziness ? (
          <View style={{ width: "100%" }}>
            <BuzinessItem data={selectedBuziness} />
          </View>
        ) : (
          <Button
            mode="contained-tonal"
            loading={loading}
            style={{ alignSelf: "center" }}
            onPress={() => load()}
          >
            Keress ezen a környéken
          </Button>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: -4,
  },
});
