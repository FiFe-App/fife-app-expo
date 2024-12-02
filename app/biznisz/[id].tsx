import MyLocationIcon from "@/assets/images/myLocationIcon";
import ErrorScreen from "@/components/ErrorScreen";
import ProfileImage from "@/components/ProfileImage";
import { ThemedView } from "@/components/ThemedView";
import { ContactList } from "@/components/buziness/ContactList";
import Comments from "@/components/comments/Comments";
import { LatLng, MapView, Marker } from "@/components/mapView/mapView";
import BuzinessRecommendationsModal from "@/components/user/BuzinessRecommendationsModal";
import { Tables } from "@/database.types";
import { useMyLocation } from "@/hooks/useMyLocation";
import getLinkForContact from "@/lib/functions/getLinkForContact";
import locationToCoords from "@/lib/functions/locationToCoords";
import { RecommendBuzinessButton } from "@/lib/supabase/RecommendBuzinessButton";
import { supabase } from "@/lib/supabase/supabase";
import { storeBuzinessSearchParams } from "@/redux/reducers/buzinessReducer";
import { RootState } from "@/redux/store";
import { BuzinessItemInterface, UserState } from "@/redux/store.type";
import { PostgrestError } from "@supabase/supabase-js";
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
  Chip,
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
  const [data, setData] = useState<BuzinessItemInterface | undefined>();
  const [defaultContact, setDefaultContact] =
    useState<Tables<"contacts"> | null>();
  const [requestContanct, setRequestContanct] = useState(false);
  const [error, setError] = useState<null | Partial<PostgrestError>>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [showRecommendsModal, setShowRecommendsModal] = useState(false);
  const iRecommended = recommendations?.includes(myUid || "");
  const location: LatLng | null = data
    ? { latitude: data.lat, longitude: data.long }
    : null;
  const categories = data?.title?.split(" $ ");
  const title = categories?.[0];
  const [isLongDescription, setIsLongDescription] = useState<
    undefined | boolean
  >(undefined);
  const myBuziness = myUid === data?.author;
  const { myLocation } = useMyLocation();
  const nav = useNavigation();
  const [commentsCount, setCommentsCount] = useState<number>();

  useFocusEffect(
    useCallback(() => {
      setIsLongDescription(undefined);
      const load = () => {
        setShowRecommendsModal(false);

        if (!id) return;
        supabase
          .from("buziness")
          .select(
            "*, contacts(*), profiles ( full_name, avatar_url ), buzinessRecommendations!buzinessRecommendations_buziness_id_fkey(author)",
          )
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
              const cords = locationToCoords(String(data.location));
              nav.setOptions({ title: data?.title.split(" ")[0] });
              setData({
                ...data,
                lat: cords[1],
                long: cords[0],
                distance: 0,
                authorName: data?.profiles?.full_name || "???",
                avatarUrl: data?.profiles?.avatar_url,
              });
              if (data.defaultContact) {
                if (data.contacts) {
                  setDefaultContact(data.contacts);
                } else {
                  setRequestContanct(true);
                }
              }

              setRecommendations(
                data?.buzinessRecommendations?.map((pr) => pr.author),
              );
            } else
              setError({
                code: "jaj basszus",
                message: "Ez a biznisz nem található",
              });
          });
        supabase
          .from("comments")
          .select("count")
          .eq("key", "buziness/" + id)
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
    if (myBuziness) {
      router.navigate({
        pathname: "/biznisz/edit/[editId]",
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
                    <Text style={{ textAlign: "center" }}>
                      {data.authorName} biznisze
                    </Text>
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
                  recommendations?.length
                    ? () => setShowRecommendsModal(true)
                    : undefined
                }
              >
                <Text style={{ textAlign: "center" }}>
                  {recommendations?.length
                    ? recommendations?.length + " ajánlás"
                    : "Még senki sem ajánlja"}
                </Text>
              </TouchableRipple>
            </View>
            <View
              style={{
                flexWrap: "wrap",
                flexDirection: "row",
                gap: 4,
                padding: 10,
              }}
            >
              {categories?.slice(1).map((e, i) => {
                if (e.trim())
                  return (
                    <Chip
                      key={"category" + i}
                      textStyle={{ margin: 4 }}
                      onPress={() => {
                        dispatch(storeBuzinessSearchParams({ text: e }));
                        router.navigate({
                          pathname: "/biznisz",
                        });
                      }}
                    >
                      {e}
                    </Chip>
                  );
              })}
            </View>
            <View style={{ flexDirection: "row", gap: 4, padding: 4 }}>
              {myBuziness && (
                <Button
                  style={{ flex: 1 }}
                  mode="contained"
                  onPress={onPimary}
                  disabled={!myBuziness}
                >
                  Szerkesztés
                </Button>
              )}

              {defaultContact && (
                <Link asChild href={getLinkForContact(defaultContact)}>
                  <Button style={{ flex: 1 }} mode="contained">
                    {defaultContact.title || defaultContact?.data}
                  </Button>
                </Link>
              )}
              {requestContanct && (
                <Button style={{ flex: 1 }} mode="contained">
                  Kérd el a kontaktját
                </Button>
              )}

              {!myBuziness && (
                <RecommendBuzinessButton
                  buzinessId={id}
                  style={{ flex: 1 }}
                  recommended={iRecommended}
                  setRecommended={(recommendedByMe) => {
                    if (myUid) {
                      if (recommendedByMe)
                        setRecommendations([...recommendations, myUid]);
                      else
                        setRecommendations(
                          recommendations.filter((uid) => uid !== myUid),
                        );
                    }
                  }}
                />
              )}
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
              <Text
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
                  <Text>{isLongDescription ? "Több" : ""}</Text>
                )}
              </Text>
            </TouchableRipple>
            <TabsProvider defaultIndex={0}>
              <Tabs showTextLabel={width > 400}>
                <TabScreen label="Helyzete" icon="map-marker">
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
                <TabScreen label="Elérhetőségek" icon="contacts">
                  <ContactList uid={data.author} />
                </TabScreen>
                <TabScreen
                  label="Vélemények"
                  icon="chat"
                  badge={commentsCount || undefined}
                >
                  <Comments
                    path={"buziness/" + id}
                    placeholder="Mondd el a véleményed"
                  />
                </TabScreen>
              </Tabs>
            </TabsProvider>
          </>
        )}
        {!!title && (
          <Portal>
            <BuzinessRecommendationsModal
              show={showRecommendsModal}
              setShow={setShowRecommendsModal}
              id={id}
              name={title}
            />
          </Portal>
        )}
        {!!error && (
          <ErrorScreen
            icon="briefcase-off"
            title={error.code}
            text={error.message}
          />
        )}
      </ScrollView>
    </ThemedView>
  );
}
