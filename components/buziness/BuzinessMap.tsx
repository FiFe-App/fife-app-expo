import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
import BuzinessItem from "./BuzinessItem";
import { RootState } from "@/redux/store";
import { useDispatch, useSelector } from "react-redux";
import { Camera, Details, MapView, Marker, Region } from "../mapView/mapView";
import MyLocationIcon from "@/assets/images/myLocationIcon";
import { useMyLocation } from "@/hooks/useMyLocation";
import locationToCoords from "@/lib/functions/locationToCoords";
import { storeBuzinessSearchParams } from "@/redux/reducers/buzinessReducer";
import { FAB } from "react-native-paper";
import mapStyles from "../mapView/style";

interface BuzinessBuzinessMapProps {
  load: (arg0: number) => void;
}

export const BuzinessMap: React.FC<BuzinessBuzinessMapProps> = ({ load }) => {
  const dispatch = useDispatch();
  const { buzinesses, buzinessSearchParams } = useSelector(
    (state: RootState) => state.buziness,
  );

  const skip = buzinessSearchParams?.skip || 0;
  const loading = buzinessSearchParams?.loading || false;
  const take = 5;
  const [selectedBuzinessId, setSelectedBuzinessId] = useState<null | number>(
    null,
  );
  const selectedBuziness = buzinesses.find((b) => b.id === selectedBuzinessId);
  const [mapHeight, setMapHeight] = useState<number>(0);
  const [circleRadiusText, setCircleRadiusText] = useState("0 km");
  const mapRef = useRef<any>(null);

  const { myLocation, locationError } = useMyLocation();

  const panToMyLocation = () => {
    if (!mapRef.current || !myLocation) return;
    const region = {
      latitude: myLocation.coords.latitude,
      longitude: myLocation.coords.longitude,
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
    dispatch(
      storeBuzinessSearchParams({
        searchCircle: {
          location: { latitude: region.latitude, longitude: region.longitude },
          radius: region.latitudeDelta,
        },
      }),
    );
  };
  useEffect(() => {
    console.log(buzinessSearchParams?.searchCircle);
    //load(skip + take);
  }, [buzinessSearchParams?.searchCircle]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        //@ts-ignore
        options={{
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
          zoomControl: false,
        }}
        style={{ width: "100%", height: "100%" }}
        initialCamera={{
          altitude: 10,
          center: {
            latitude: myLocation?.coords.latitude || 47.4979,
            longitude: myLocation?.coords.longitude || 19.0402,
          },
          heading: 0,
          pitch: 0,
          zoom: 12,
        }}
        provider="google"
        googleMapsApiKey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}
        pitchEnabled={false}
        rotateEnabled={false}
        toolbarEnabled={false}
        onRegionChangeComplete={onRegionChange}
        onPress={() => setSelectedBuzinessId(null)}
      >
        {buzinesses.map((buziness) => {
          if (buziness?.id < 0) return;

          const cords = locationToCoords(String(buziness.location));
          return (
            <Marker
              coordinate={{ latitude: cords[1], longitude: cords[0] }}
              title={buziness.title}
              key={buziness.id}
              onPress={() => setSelectedBuzinessId(buziness.id)}
            />
          );
        })}
        {myLocation && (
          <Marker
            centerOffset={{ x: 10, y: 10 }}
            coordinate={myLocation?.coords}
            style={{ justifyContent: "center", alignItems: "center" }}
          >
            <MyLocationIcon style={{ width: 20, height: 20 }} />
          </Marker>
        )}

        {!!myLocation && (
          <FAB
            icon="map-marker"
            style={mapStyles.myLocationButton}
            onPress={panToMyLocation}
          />
        )}
      </MapView>
      {selectedBuziness && (
        <View style={{ position: "absolute", bottom: 8, width: "100%" }}>
          <BuzinessItem data={selectedBuziness} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: -4,
  },
  businessItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
});
