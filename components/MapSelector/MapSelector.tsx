import { useMyLocation } from "@/hooks/useMyLocation";
import React, { useRef, useState } from "react";
import { Text, View } from "react-native";
import { Button, FAB, Icon, IconButton } from "react-native-paper";
import MyLocationIcon from "../../assets/images/myLocationIcon";
import { Camera, Details, MapView, Marker, Region } from "../mapView/mapView";
import styles from "../mapView/style";
import { ThemedText } from "../ThemedText";
import { MapCircleType, MapSelectorProps } from "./MapSelector.types";

const MapSelector = ({
  style,
  searchEnabled,
  title,
  text,
  data,
  setData,
  setOpen,
}: MapSelectorProps) => {
  const [mapHeight, setMapHeight] = useState<number>(0);
  const circleSize = mapHeight / 3;
  const [circle, setCircle] = useState<MapCircleType>(
    data || {
      location: { latitude: 47.4979, longitude: 19.0402 },
      radius: 300,
    },
  );
  const [circleRadiusText, setCircleRadiusText] = useState("0 km");
  const mapRef = useRef<MapView>(null);

  const { myLocation, locationError } = useMyLocation();

  const onRegionChange:
    | ((region: Region, details: Details) => void)
    | undefined = async (e) => {
    if (!mapHeight) return;
    const km = (e.latitudeDelta * 111.32 * circleSize) / mapHeight;

    let text = Math.round(km) + " km";
    if (km < 2) {
      text = Math.round(km * 1000) + " m";
    }

    setCircle({
      location: {
        latitude: e.latitude,
        longitude: e.longitude,
      },
      radius: km * 1000,
    });
    setCircleRadiusText(text);
  };

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

  const onSubmit = () => {
    if (setData && circle) {
      console.log("map submit", circle, setOpen);
      setData(circle);
      if (setOpen) setOpen(false);
    }
  };
  const removeSumbit = () => {
    if (setData) {
      setData(undefined);
      console.log("map submit", circle, setOpen);
      if (setOpen) setOpen(false);
    }
  };

  return (
    <View style={[{ flex: 1 }, style]}>
      <View
        style={{ width: "100%", height: "100%" }}
        onLayout={(e) => {
          setMapHeight(e.nativeEvent.layout.height);
        }}
      >
        <ThemedText type="title">{title}</ThemedText>
        <ThemedText>{text}</ThemedText>
        <MapView
          ref={mapRef}
          // @ts-expect-error options type are colliding in different mapViews
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
              latitude: circle.location.latitude,
              longitude: circle.location.longitude,
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
        >
          {myLocation && (
            <Marker
              centerOffset={{ x: 10, y: 10 }}
              coordinate={myLocation?.coords}
              style={{ justifyContent: "center", alignItems: "center" }}
            >
              <MyLocationIcon style={{ width: 20, height: 20 }} />
            </Marker>
          )}
          <View style={styles.submit}>
            <Button mode="contained" onPress={onSubmit} disabled={!circle}>
              <Text>Helyzet mentése</Text>
            </Button>
          </View>
          <View style={styles.zoom}>
            <IconButton
              icon="plus"
              style={{
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                margin: 0,
              }}
              onPress={() => zoom(1)}
              mode="contained-tonal"
            />
            <IconButton
              icon="minus"
              style={{
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                margin: 0,
              }}
              onPress={() => zoom(-1)}
              mode="contained-tonal"
            />
          </View>
        </MapView>
        <View style={{ padding: 8 }}>
          {!!locationError && (
            <ThemedText>
              <Icon source="map-marker-alert" size={16} />
              {locationError}
            </ThemedText>
          )}
          <Button
            style={{ alignSelf: "flex-end" }}
            mode="elevated"
            onPress={removeSumbit}
            icon="delete"
          >
            Helyzet törlése
          </Button>
        </View>
      </View>

      {!!myLocation && (
        <FAB
          style={styles.myLocationButton}
          icon={myLocation ? "map-marker" : "map-marker-question"}
          onPress={panToMyLocation}
        />
      )}

      {!!circleSize && (
        <View
          style={[
            styles.circleFixed,
            {
              width: circleSize,
              height: circleSize,
              marginLeft: -circleSize / 2,
              marginTop: -circleSize / 2,
              borderRadius: circleSize,
            },
          ]}
        >
          <Text style={styles.circleText}>Átmérő: {circleRadiusText}</Text>
        </View>
      )}
    </View>
  );
};

export default MapSelector;
