import NewMarkerIcon from "@/assets/images/newMarkerIcon";
import { useMyLocation } from "@/hooks/useMyLocation";
import React, { useMemo, useRef, useState } from "react";
import { FlatList, Pressable, ScrollView, Text, View } from "react-native";
import {
  Button,
  Card,
  FAB,
  Icon,
  IconButton,
  List,
  Switch,
  TextInput,
} from "react-native-paper";
import {
  Autocomplete,
  AutocompleteScrollView,
} from "react-native-paper-autocomplete";
import MyLocationIcon from "../../assets/images/myLocationIcon";
import {
  Camera,
  Details,
  LatLng,
  MapView,
  Marker,
  Region,
} from "../mapView/mapView";
import styles from "../mapView/style";
import { ThemedText } from "../ThemedText";
import { MapLocationType, MapSelectorProps } from "./MapSelector.types";
import { ThemedView } from "../ThemedView";

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
  const [step, setStep] = useState(0);
  const circleSize = mapHeight / 3;
  const [location, setLocation] = useState<MapLocationType>(
    data || {
      location: { latitude: 47.4979, longitude: 19.0402 },
    },
  );
  const [search, setSearch] = useState("");
  const [addressList, setAddressList] = useState<google.maps.GeocoderResult[]>(
    [],
  );
  const [selectedAddress, setSelectedAddress] =
    useState<google.maps.GeocoderResult | null>(null);
  const showList = addressList && selectedAddress?.formatted_address !== search;
  const [approxLocation, setApproxLocation] = useState(false);
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
    if (setData && location) {
      console.log("map submit", location, setOpen);
      setData(location);
      if (setOpen) setOpen(false);
    }
  };
  const removeSumbit = () => {
    if (setData) {
      setData(undefined);
      console.log("map submit", location, setOpen);
      if (setOpen) setOpen(false);
    }
  };

  const turnToAddress = async (address: string) => {
    if (address.length < 4) return;
    const geocoder = new google.maps.Geocoder();
    const coded = await geocoder.geocode({
      address,
      componentRestrictions: { country: "HU" },
    });

    return coded;
  };
  const reverseAddress = async (location: LatLng) => {
    const geocoder = new google.maps.Geocoder();
    const coded = await geocoder.geocode({
      location: {
        lat: location.latitude,
        lng: location.longitude,
      },
    });

    return coded;
  };
  const debounce = <T,>(func: (param: T) => void, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (args: T) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(args), wait);
    };
  };

  // Inside the MapSelector component, add this before the searchPlaces function
  const debouncedSearch = useMemo(
    () =>
      debounce((searchTerm: string) => {
        if (!searchTerm) return;
        console.log("Searching... ", searchTerm);

        turnToAddress(searchTerm).then((res) => {
          console.log(res);
          if (res) setAddressList(res.results);
        });
      }, 500),
    [],
  );
  const debouncedReverseSearch = useMemo(
    () =>
      debounce((location: LatLng) => {
        if (!location) return;
        console.log("Reverse Searching... ", location);

        reverseAddress(location).then((res) => {
          console.log(res);
          if (res) setAddressList(res.results);
        });
      }, 500),
    [],
  );
  const toggleApproxLocation = () => {
    setApproxLocation(!approxLocation);
  };

  if (step === 0)
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
          <View>
            <TextInput
              placeholder="Keress címre..."
              onChangeText={(text) => {
                setSearch(text);
                debouncedSearch(text);
              }}
              value={search}
              right={
                <TextInput.Icon
                  icon={showList ? "chevron-up" : "chevron-down"}
                />
              }
            />
            {showList && (
              <FlatList
                style={styles.addressList}
                data={addressList}
                renderScrollComponent={(props) => (
                  <Card mode="elevated" style={styles.addressList}>
                    {props.children}
                  </Card>
                )}
                renderItem={(props) => (
                  <List.Item
                    title={props.item.formatted_address}
                    onPress={(e) => {
                      const address = props.item;
                      console.log("address", address);
                      if (address && mapRef.current) {
                        setSelectedAddress(address);
                        setSearch(address.formatted_address);
                        const region = {
                          latitude: address.geometry.location.lat(),
                          longitude: address.geometry.location.lng(),
                          latitudeDelta: 0.0043,
                          longitudeDelta: 0.0034,
                        };
                        mapRef.current.animateToRegion(region, 1000);
                      }
                    }}
                  />
                )}
              />
            )}
          </View>
          <View
            style={{ width: "100%", height: 300, maxHeight: 300, zIndex: 0 }}
          >
            <MapView
              ref={mapRef}
              options={{
                mapTypeControl: false,
                fullscreenControl: false,
                streetViewControl: false,
                zoomControl: false,
              }}
              style={{ width: "100%", height: "100%", maxHeight: 200 }}
              initialCamera={{
                altitude: 10,
                center: {
                  latitude: location.location.latitude,
                  longitude: location.location.longitude,
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
                  coordinate={myLocation?.coords}
                  anchor={{ x: 0.5, y: 0.5 }}
                >
                  <MyLocationIcon style={{ width: 20, height: 20 }} />
                </Marker>
              )}

              {selectedAddress?.geometry && (
                <Marker
                  coordinate={{
                    latitude: selectedAddress.geometry.location.lat(),
                    longitude: selectedAddress.geometry.location.lng(),
                  }}
                  anchor={{ x: 0.5, y: 0.5 }}
                >
                  <NewMarkerIcon
                    style={[
                      {
                        width: 24,
                        height: 24,
                      },
                    ]}
                  />
                </Marker>
              )}
            </MapView>
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
            {!!myLocation && (
              <FAB
                style={styles.myLocationButton}
                icon={myLocation ? "map-marker" : "map-marker-question"}
                onPress={panToMyLocation}
              />
            )}
          </View>
          <View style={{ padding: 8 }}>
            {!!locationError && (
              <ThemedText>
                <Icon source="map-marker-alert" size={16} />
                {locationError}
              </ThemedText>
            )}
            <View
              style={{ alignSelf: "flex-end", flexDirection: "row", gap: 8 }}
            >
              <Button
                mode="contained"
                onPress={() => setStep(1)}
                disabled={!location}
              >
                <Text>Kiválasztás</Text>
              </Button>
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
        </View>
      </View>
    );
  if (step === 1)
    return (
      <View>
        <View
          style={{
            flexDirection: "row",
            gap: 4,
            alignItems: "center",
          }}
        >
          <Button mode="text" icon="arrow-left" onPress={() => setStep(0)}>
            Módosítás
          </Button>
        </View>
        <ThemedText>
          Kiválasztva: {selectedAddress?.formatted_address}
        </ThemedText>
        <View style={{ flexDirection: "row", gap: 4, padding: 8 }}>
          <Switch value={approxLocation} onValueChange={toggleApproxLocation} />
          <Pressable onPress={toggleApproxLocation}>
            <Text>Szeretnéd, hogy pontos cím legyen látható?</Text>
          </Pressable>
        </View>
        <Button mode="contained" onPress={onSubmit} disabled={!location}>
          <Text>Helyzet mentése</Text>
        </Button>
      </View>
    );
};

export default MapSelector;
