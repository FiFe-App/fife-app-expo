import MyLocationIcon from "@/assets/images/myLocationIcon";
import ErrorScreen from "@/components/ErrorScreen";
import ProfileImage from "@/components/ProfileImage";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Comments from "@/components/comments/Comments";
import EventGoingResponses from "@/components/events/EventGoingsModal";
import GoingInput from "@/components/events/GoingInput";
import { LatLng, MapView, Marker } from "@/components/mapView/mapView";
import { useMyLocation } from "@/hooks/useMyLocation";
import { supabase } from "@/lib/supabase/supabase";
import { RootState } from "@/redux/store";
import { EventItemInterface, UserState } from "@/redux/store.type";
import { PostgrestError } from "@supabase/supabase-js";
import {
  Link,
  useFocusEffect,
  useGlobalSearchParams,
  useNavigation,
} from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, useWindowDimensions, View } from "react-native";
import openMap from "react-native-open-maps";
import {
  ActivityIndicator,
  Card,
  Icon,
  IconButton,
  Text,
  TouchableRipple,
} from "react-native-paper";
import { Tabs, TabScreen, TabsProvider } from "react-native-paper-tabs";
import { useSelector } from "react-redux";

export default function Index() {
  const { id: paramId } = useGlobalSearchParams();
  const { width } = useWindowDimensions();
  const { uid: myUid }: UserState = useSelector(
    (state: RootState) => state.user,
  );
  const id: number = Number(paramId);
  const [goingValue, setGoingValue] = useState(0);
  const [data, setData] = useState<EventItemInterface | undefined>();
  const [error, setError] = useState<null | Partial<PostgrestError>>(null);
  const [showGoingsModal, setShowGoingsModal] = useState(false);
  const location: LatLng | null =
    data?.lat && data?.long
      ? { latitude: data.lat || 0, longitude: data.long || 0 }
      : null;
  const categories = data?.title?.split(" $ ");
  const title = categories?.[0];
  const [isLongDescription, setIsLongDescription] = useState<
    undefined | boolean
  >(undefined);
  const myEvent = myUid === data?.author;
  const { myLocation } = useMyLocation();
  const nav = useNavigation();
  const [commentsCount, setCommentsCount] = useState<number | undefined>(
    undefined,
  );
  const [defaultValue, setDefaultValue] = useState(0);

  const sumPeople =
    data?.eventResponses?.reduce((e, c) => {
      if (c.value) return e + c.value / 10;
      return e;
    }, 0) || 0;
  const estimatedPeople = Math.round(sumPeople - defaultValue + goingValue);

  useFocusEffect(
    useCallback(() => {
      setIsLongDescription(undefined);
      const load = () => {
        setShowGoingsModal(false);

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

            if (data) {
              nav.setOptions({ title: data?.title });
              setData({
                ...data,
                lat: data?.location?.coordinates[1] || null,
                long: data?.location?.coordinates[0] || null,
                authorName: data?.profiles?.full_name || "???",
                avatarUrl: data?.profiles?.avatar_url,
              });
              const goindValue =
                data.eventResponses.find((res) => {
                  return res.user_id === myUid;
                })?.value || 0;
              setDefaultValue(goindValue / 10);
              setGoingValue(goindValue / 10);
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

            setCommentsCount(res.data?.count || undefined);
          });
      };
      load();
      return () => {
        setShowGoingsModal(false);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]),
  );

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flex: 1 }}>
        {!data && !error && <ActivityIndicator />}
        {!!id && !error && !!data && (
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
                        borderRadius: 100,
                        marginRight: 16,
                      }}
                      avatar_url={data.avatarUrl}
                    />
                    <ThemedText style={{ textAlign: "center" }}>
                      {data.authorName} eseménye
                    </ThemedText>
                  </View>
                </TouchableRipple>
              </Link>
            </View>

            <View style={{ gap: 4, paddingHorizontal: 16 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 4,
                }}
              >
                <ThemedText style={{ flex: 1 }}>
                  <Icon source="calendar" size={16} />
                  <Text style={{ marginHorizontal: 4 }}>
                    {new Date(data.date).toLocaleString("hu-HU")}
                  </Text>
                </ThemedText>
                <ThemedText>
                  <Text style={{ marginHorizontal: 4 }}>{data.duration}</Text>
                  <Icon source="clock" size={16} />
                </ThemedText>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 4,
                }}
              >
                <ThemedText style={{ flexGrow: 1 }}>
                  <Icon source="map-marker" size={16} />
                  <Text style={{ marginHorizontal: 4 }}>
                    {data.locationName}
                  </Text>
                </ThemedText>

                <TouchableRipple
                  style={{
                    flexGrow: 1,
                    alignItems: "flex-end",
                    justifyContent: "center",
                  }}
                  onPress={
                    estimatedPeople > 0
                      ? () => setShowGoingsModal(true)
                      : undefined
                  }
                >
                  <ThemedText style={{ textAlign: "center" }}>
                    <Text style={{ marginHorizontal: 4 }}>
                      {estimatedPeople
                        ? "kb. " + estimatedPeople + " fő"
                        : "Senki sem jelzett vissza, hogy jönne"}
                    </Text>
                    <Icon source="account-multiple" size={16} />
                  </ThemedText>
                </TouchableRipple>
              </View>
            </View>
            {!myEvent && !data.description && (
              <>
                <TouchableRipple
                  onPress={
                    isLongDescription !== undefined
                      ? () => {
                          setIsLongDescription(!isLongDescription);
                        }
                      : undefined
                  }
                  disabled={isLongDescription !== undefined}
                  style={{ margin: 16 }}
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
                <Card style={{ padding: 8, margin: 4 }}>
                  {!myEvent && (
                    <GoingInput
                      eventId={data.id}
                      value={goingValue}
                      onOuterValueChange={setGoingValue}
                    />
                  )}
                </Card>
              </>
            )}
            <TabsProvider defaultIndex={0}>
              <Tabs showTextLabel={width > 400}>
                {location && (
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
                )}
                {!!title && (
                  <TabScreen
                    label="Kik?"
                    icon="account-multiple"
                    badge={estimatedPeople}
                  >
                    <EventGoingResponses
                      show={showGoingsModal}
                      setShow={setShowGoingsModal}
                      id={id}
                      name={title}
                    />
                  </TabScreen>
                )}
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
