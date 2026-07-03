import { useMyLocation } from "@/hooks/useMyLocation";
import React, { useMemo, useRef, useState } from "react";
import { Platform, FlatList, Text, View } from "react-native";
import {
  Button,
  Card,
  Chip,
  FAB,
  Icon,
  IconButton,
  List,
  TextInput,
  useTheme
} from "react-native-paper";
import NewMarkerIcon from "@/assets/images/newMarkerIcon";
import { Camera, Circle, MapView, Marker } from "../mapView/mapView";
import FiFeMap from "../mapView/FiFeMap";
import styles from "../mapView/style";
import { MapSelectorProps } from "./MapSelector.types";
import { CircleType } from "@/redux/store.type";
import { ThemedText } from "../ThemedText";

const defaultMapLocation = {
  location: {
    latitude: 47.497913,
    longitude: 19.040236,
  },
  radius: 20,
};

const MapSelector = ({
  style,
  data,
  setData,
  setOpen,
  markerOnly,
  children,
}: MapSelectorProps) => {
  const theme = useTheme();
  const [mapHeight, setMapHeight] = useState<number>(0);
  const circleSize = mapHeight / 3;
  const [circleRadiusText] = useState("");
  const [circle, setCircle] = useState<CircleType>(() => {
    const src = data || defaultMapLocation;
    // Normalize: persisted Redux state may have a stale/different coordinate format
    // (e.g. { lat, lng } instead of { latitude, longitude }). Passing undefined
    // coordinates to Android native map causes NoSuchKeyException: latitude.
    if (typeof src?.location?.latitude === "number" && typeof src?.location?.longitude === "number") {
      return src;
    }
    return defaultMapLocation;
  });
  interface GeoResult {
    formatted_address: string;
    geometry: { location: { lat: () => number; lng: () => number } };
    place_id?: string;
  }
  const [search, setSearch] = useState("");
  const [addressList, setAddressList] = useState<GeoResult[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<GeoResult | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const showList = addressList.length > 0 && selectedAddress?.formatted_address !== search && searchFocused;
  const mapRef = useRef<MapView>(null);

  const { myLocation } = useMyLocation();

  // Determine if we're using dark theme
  const isDarkTheme = theme.dark;

  const panToMyLocation = () => {
    if (!mapRef.current || !myLocation) return;
    const region = {
      latitude: myLocation.coords?.latitude,
      longitude: myLocation.coords?.longitude,
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

  const getPlaceDetails = async (placeId: string) => {
    if (!placeId) return null;

    if (Platform.OS === "web" && typeof google !== "undefined" && google.maps?.places?.PlacesService) {
      const service = new google.maps.places.PlacesService(document.createElement("div"));
      return await new Promise<{ latitude: number; longitude: number } | null>((resolve) => {
        service.getDetails({ placeId, fields: ["geometry"] }, (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
            resolve({
              latitude: place.geometry.location.lat(),
              longitude: place.geometry.location.lng(),
            });
            return;
          }
          resolve(null);
        });
      });
    }

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=geometry&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(url);
    const json = await response.json();
    if (json.status !== "OK" || !json.result?.geometry?.location) return null;

    return {
      latitude: json.result.geometry.location.lat,
      longitude: json.result.geometry.location.lng,
    };
  };

  const turnToAddress = async (address: string) => {
    const trimmedAddress = address.trim();
    if (trimmedAddress.length < 4) return { results: [] };

    if (Platform.OS === "web" && typeof google !== "undefined" && google.maps?.places?.AutocompleteService) {
      const service = new google.maps.places.AutocompleteService();
      const predictions = await new Promise<google.maps.places.AutocompletePrediction[]>((resolve) => {
        service.getPlacePredictions(
          {
            input: trimmedAddress,
            componentRestrictions: { country: "HU" },
            types: ["address", "establishment", "geocode"],
          },
          (predictions, status) => {
            if (status !== google.maps.places.PlacesServiceStatus.OK || !predictions) {
              resolve([]);
              return;
            }
            resolve(predictions);
          },
        );
      });

      return {
        results: predictions.map((prediction) => ({
          formatted_address: prediction.description,
          place_id: prediction.place_id,
          geometry: {
            location: {
              lat: () => 0,
              lng: () => 0,
            },
          },
        })),
      };
    }

    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(trimmedAddress)}&components=country:HU&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(url);
    const json = await response.json();
    if (json.status !== "OK") return { results: [] };

    return {
      results: (json.predictions ?? []).map((prediction: { description: string; place_id: string }) => ({
        formatted_address: prediction.description,
        place_id: prediction.place_id,
        geometry: {
          location: {
            lat: () => 0,
            lng: () => 0,
          },
        },
      })),
    };
  };
  const debounce = <T,>(func: (param: T) => void, wait: number) => {
    let timeout: ReturnType<typeof setTimeout>;
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
  return (
    <View style={[{ flex: 1, overflow: "hidden", borderRadius: 16 }, style]}>
      <View
        style={{ width: "100%", height: "100%", borderRadius: 16 }}
        onLayout={(e) => {
          setMapHeight(e.nativeEvent.layout.height);
        }}
      >
        <View style={{ zIndex: 10, position: "absolute", width: "100%" }}>
          <TextInput
            inputMode="search"
            mode="outlined"
            placeholder="Keress címre..."
            onChangeText={(text) => {
              setSearch(text);
              if (!text.trim()) {
                setAddressList([]);
                setSelectedAddress(null);
                return;
              }
              debouncedSearch(text);
            }}
            outlineStyle={{borderRadius: 999}}
            style={{margin: 6}}
            onFocus={() => setSearchFocused(true)}
            value={search}
          />
          {showList && (
            <FlatList
              style={styles.addressList}
              data={addressList}
              renderScrollComponent={(props) => (
                <Card style={styles.addressList}>
                  {props.children}
                </Card>
              )}
              renderItem={(props) => (
                <List.Item
                  style={{ zIndex: 1000 }}
                  title={props.item.formatted_address}
                  onPress={async () => {
                    const address = props.item;
                    if (!address || !mapRef.current) return;

                    setSelectedAddress(address);
                    setSearch(address.formatted_address);
                    setAddressList([]);

                    const details = await getPlaceDetails(address.place_id ?? "");
                    const region = details
                      ? {
                          latitude: details.latitude,
                          longitude: details.longitude,
                          latitudeDelta: 0.0043,
                          longitudeDelta: 0.0034,
                        }
                      : {
                          latitude: address.geometry.location.lat(),
                          longitude: address.geometry.location.lng(),
                          latitudeDelta: 0.0043,
                          longitudeDelta: 0.0034,
                        };

                    setCircle({ location: region, radius: 20 });
                    mapRef.current.animateToRegion(region, 1000);
                  }}
                />
              )}
            />
          )}
        </View>
        <View
          style={{ width: "100%", flex: 1, zIndex: 0 }}
        >
          <FiFeMap
            ref={mapRef}
            onPoiClick={() => {
              // no-op: suppress default POI behavior
            }}
            onPress={(e) => {
              setCircle({...circle,location: e.nativeEvent.coordinate});
              setSearchFocused(false);
            }}
            style={{ width: "100%", height: "100%" }}
            initialCamera={{
              center: {
                latitude: circle.location.latitude ?? defaultMapLocation.location.latitude,
                longitude: circle.location.longitude ?? defaultMapLocation.location.longitude,
              },
            }}
            //onRegionChangeComplete={onRegionChange}
          >
            {data?.location && data.location.latitude !== myLocation?.coords.latitude && data.location.longitude !== myLocation?.coords.longitude && (markerOnly ?
              <Marker
                zIndex={data.location.longitude}
                coordinate={
                  data?.location
                }
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <NewMarkerIcon style={{ opacity: 0.5 }} />
              </Marker>
              : <Circle
                zIndex={50}
                center={
                  data?.location
                }
                strokeColor={isDarkTheme ? "#ffffff18" : "#00000088"}
                fillColor={isDarkTheme ? "#ffffff38" : "#00000038"}
                radius={data?.radius}
              >
              </Circle>)}
            {circle?.location && (markerOnly ?
              <Marker
                coordinate={
                  circle?.location
                }
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <NewMarkerIcon />
              </Marker>
              : <Circle
                center={
                  circle?.location
                }
                strokeColor={isDarkTheme ? "#ffffffaa" : "#00000044"}
                fillColor={isDarkTheme ? "#ffffff44" : "#00000028"}
                radius={circle?.radius}
              >
              </Circle>)}

            {myLocation && (
              <Marker
                zIndex={myLocation.coords.longitude}
                
                coordinate={myLocation?.coords}
                anchor={{ x: 0.5, y: 1 }}
              >
                <Icon source="map-marker" size={28} color={theme.colors.tertiary} />
              </Marker>
            )}

          </FiFeMap>
          <View style={{position:"absolute",top:80,width:"100%",alignItems:"center"}}>          
            <Chip icon="map-marker"><ThemedText variant="labelSmall">Kattints a térképre hogy kiválassz egy pontot!</ThemedText></Chip>
          </View>
          {!!circleSize && <View style={[styles.circleFixed, {
            width: circleSize,
            height: circleSize,
            marginLeft: -circleSize / 2,
            marginTop: -circleSize / 2,
            borderRadius: circleSize
          }]}>
            <Text style={styles.circleText}>Átmérő: {circleRadiusText}</Text>
          </View>}
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
              style={[styles.myLocationButton, { top: 130 }]}
              icon={myLocation ? "map-marker" : "map-marker-question"}
              onPress={panToMyLocation}
            />
          )}
        </View>
        {children}
        <View style={{ padding: 8 }}>

          <View
            style={{ alignSelf: "flex-end", flexDirection: "row", gap: 8 }}
          >
            <Button
              style={{ alignSelf: "flex-end" }}
              mode="elevated"
              onPress={() => setOpen(false)}
            >
              Mégsem
            </Button>
            <Button
              mode="contained"
              onPress={onSubmit}
              disabled={!circle}
            >
              <Text>Kiválasztás</Text>
            </Button>
          </View>
        </View>
      </View>
    </View>
  );
};

export default MapSelector;
