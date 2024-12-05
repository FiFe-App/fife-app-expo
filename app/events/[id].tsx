import MyLocationIcon from "@/assets/images/myLocationIcon";
import ErrorScreen from "@/components/ErrorScreen";
import ProfileImage from "@/components/ProfileImage";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Comments from "@/components/comments/Comments";
import GoingInput from "@/components/events/GoingInput";
import { LatLng, MapView, Marker } from "@/components/mapView/mapView";
import { useMyLocation } from "@/hooks/useMyLocation";
import locationToCoords from "@/lib/functions/locationToCoords";
import { supabase } from "@/lib/supabase/supabase";
import { RootState } from "@/redux/store";
import { EventItemInterface, UserState } from "@/redux/store.type";
import Slider from "@react-native-community/slider";
import { PostgrestError } from "@supabase/supabase-js";
import { Image } from "expo-image";
import {
  Link,
  router,
  useFocusEffect,
  useGlobalSearchParams,
  useNavigation,
} from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, useWindowDimensions, View } from "react-native";
import openMap from "react-native-open-maps";
import {
  ActivityIndicator,
  Button,
  Card,
  Chip,
  Icon,
  IconButton,
  Portal,
  Text,
  TouchableRipple,
} from "react-native-paper";
import { Tabs, TabScreen, TabsProvider } from "react-native-paper-tabs";
import { useDispatch, useSelector } from "react-redux";

export default function Index() {
  const { id: paramId } = useGlobalSearchParams();
  const { width } = useWindowDimensions();
  const dispatch = useDispatch();
  const { uid: myUid }: UserState = useSelector(
    (state: RootState) => state.user,
  );
  const id: number = Number(paramId);
  const [goingValue, setGoingValue] = useState(0);
  const [data, setData] = useState<EventItemInterface | undefined>();
  const [error, setError] = useState<null | Partial<PostgrestError>>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [showRecommendsModal, setShowRecommendsModal] = useState(false);
  const iRecommended = recommendations.includes(myUid || "");
  const location: LatLng | null = data
    ? { latitude: data.lat, longitude: data.long }
    : null;
  const categories = data?.title?.split(" $ ");
  const title = categories?.[0];
  const [isLongDescription, setIsLongDescription] = useState<
    undefined | boolean
  >(undefined);
  const myEvent = myUid === data?.author;
  const { myLocation } = useMyLocation();
  const nav = useNavigation();
  const [commentsCount, setCommentsCount] = useState<number>();

  const sumPeople =
    data?.eventResponses?.reduce((e, c) => {
      if (c.value) return e + c.value / 10;
      return e;
    }, 0) || 0;

  useFocusEffect(
    useCallback(() => {
      setIsLongDescription(undefined);
      const load = () => {
        setShowRecommendsModal(false);

        if (!id) return;
        supabase
          .from("events")
          .select("*, profiles ( full_name, avatar_url ), eventResponses(*)")
          .eq("id", id)
          .maybeSingle()
          .then(({ data, error }) => {
            if (error) {
              console.log(error);
              setError(error);
              return;
            }
            console.log(data);

            if (data) {
              nav.setOptions({ title: data?.title.split(" ")[0] });
              setData({
                ...data,
                lat: data?.location?.coordinates[1] || null,
                long: data?.location?.coordinates[0] || null,
                authorName: data?.profiles?.full_name || "???",
                avatarUrl: data?.profiles?.avatar_url,
              });
            } else
              setError({
                code: "jaj basszus",
                message: "Ez az esemény nem található",
              });
          });
        supabase
          .from("comments")
          .select("count")
          .eq("key", "event/" + id)
          .single()
          .then((res) => {
            console.log(res);

            setCommentsCount(res.data?.count);
          });
      };
      load();
      return () => {
        setShowRecommendsModal(false);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]),
  );

  useEffect(() => {
    console.log("islongDesc", isLongDescription);
  }, [isLongDescription]);

  const onPimary = () => {
    if (myEvent) {
      router.navigate({
        pathname: "/events/edit/[editId]",
        params: { editId: id },
      });
    } else {
    }
  };
  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flex: 1 }}>
        {!data && !error && <ActivityIndicator />}
        {!!id && !!data && (
          <>
            <View style={{ flexDirection: "row" }}>
              <Link
                asChild
                style={{ flex: 1, padding: 8 }}
                href={{ pathname: "/user/[uid]", params: { uid: data.author } }}
              >
                <TouchableRipple>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ProfileImage
                      uid={data.author}
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 0,
                        margin: 4,
                      }}
                      avatar_url={data.avatarUrl}
                    />
                    <ThemedText style={{ textAlign: "center" }}>
                      {data.authorName} eseménye
                    </ThemedText>
                  </View>
                </TouchableRipple>
              </Link>
              <TouchableRipple
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onPress={
                  recommendations.length
                    ? () => setShowRecommendsModal(true)
                    : undefined
                }
              >
                <ThemedText style={{ textAlign: "center" }}>
                  kb. {Math.round(sumPeople)} fő
                </ThemedText>
              </TouchableRipple>
            </View>

            <View style={{ flexDirection: "row", gap: 4, padding: 4 }}>
              {myEvent && (
                <Button
                  style={{ flex: 1 }}
                  mode="contained"
                  onPress={onPimary}
                  disabled={!myEvent}
                >
                  Szerkesztés
                </Button>
              )}
            </View>
            <View style={{ gap: 4 }}>
              <View style={{ gap: 4 }}>
                <ThemedText>{data.title}</ThemedText>
                <View
                  style={{
                    flexDirection: "row",
                    flex: 1,
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Chip>Kategória</Chip>
                  <Chip mode="outlined">Ingyenes</Chip>
                </View>
              </View>
              {!myEvent && (
                <Card style={{ padding: 8, margin: 4 }}>
                  <GoingInput
                    eventId={data.id}
                    value={goingValue}
                    onOuterValueChange={setGoingValue}
                  />
                </Card>
              )}
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <Icon source="calendar" size={14} style={{ margin: 4 }} />
                <ThemedText>
                  {new Date(data.date).toLocaleString("hu")}
                </ThemedText>
                <ThemedText style={{ flexGrow: 1, textAlign: "right" }}>
                  2 nap múlva
                </ThemedText>
              </View>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <Icon source="earth" size={14} style={{ margin: 4 }} />
                <ThemedText>{data.locationName}</ThemedText>
                <ThemedText style={{ flexGrow: 1, textAlign: "right" }}>
                  {data.duration}
                </ThemedText>
              </View>
            </View>
            <TouchableRipple
              style={{ padding: 10 }}
              onPress={
                isLongDescription !== undefined
                  ? () => {
                      setIsLongDescription(!isLongDescription);
                    }
                  : undefined
              }
              disabled={isLongDescription !== undefined}
            >
              <ThemedText
                numberOfLines={isLongDescription ? 10 : undefined}
                onLayout={(e) => {
                  if (
                    isLongDescription === undefined &&
                    e.nativeEvent.layout.height > 165
                  ) {
                  }
                }}
              >
                {data?.description}
                {isLongDescription !== undefined && (
                  <ThemedText>{isLongDescription ? "Több" : ""}</ThemedText>
                )}
              </ThemedText>
            </TouchableRipple>
            <TabsProvider defaultIndex={0}>
              <Tabs showTextLabel={width > 300}>
                <TabScreen label="Hol?" icon="map-marker">
                  <View style={{ minHeight: 200, flex: 1 }}>
                    <MapView
                      // @ts-ignore
                      options={{
                        mapTypeControl: false,
                        fullscreenControl: false,
                        streetViewControl: false,
                        zoomControl: false,
                      }}
                      style={{ width: "100%", height: "100%" }}
                      initialCamera={{
                        altitude: 10,
                        center: location || {
                          latitude: 47.4979,
                          longitude: 19.0402,
                        },
                        heading: 0,
                        pitch: 0,
                        zoom: 12,
                      }}
                      provider="google"
                      googleMapsApiKey={
                        process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
                      }
                      pitchEnabled={false}
                      rotateEnabled={false}
                      toolbarEnabled={false}
                    >
                      {location && <Marker coordinate={location} />}
                      {myLocation && (
                        <Marker
                          centerOffset={{ x: 10, y: 10 }}
                          coordinate={myLocation?.coords}
                          style={{
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <MyLocationIcon style={{ width: 20, height: 20 }} />
                        </Marker>
                      )}
                    </MapView>
                    {location && (
                      <IconButton
                        icon="directions"
                        mode="contained"
                        onPress={() =>
                          openMap({
                            latitude: location.latitude,
                            longitude: location.longitude,
                            navigate: true,
                            start: "My Location",
                            travelType: "public_transport",
                            end: location.latitude + "," + location.longitude,
                          })
                        }
                        style={{ right: 5, bottom: 5, position: "absolute" }}
                      />
                    )}
                  </View>
                </TabScreen>
                <TabScreen label="Vélemények" icon="chat" badge={commentsCount}>
                  <Comments
                    path={"event/" + id}
                    placeholder="Mondd el a véleményed"
                  />
                </TabScreen>
              </Tabs>
            </TabsProvider>
          </>
        )}
        {!!error && (
          <ErrorScreen
            icon="event-off"
            title={error.code}
            text={error.message}
          />
        )}
      </ScrollView>
    </ThemedView>
  );
}
