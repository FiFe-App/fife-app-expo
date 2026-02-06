import MyLocationIcon from "@/assets/images/myLocationIcon";
import { theme } from "@/assets/theme";
import CollapsibleText from "@/components/CollapsibleText";
import ErrorScreen from "@/components/ErrorScreen";
import ProfileImage from "@/components/ProfileImage";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import BuzinessRecommendationsModal from "@/components/buziness/BuzinessRecommendationsModal";
import { ContactList } from "@/components/buziness/ContactList";
import Comments from "@/components/comments/Comments";
import { LatLng, MapView, Marker } from "@/components/mapView/mapView";
import { Tables } from "@/database.types";
import { useMyLocation } from "@/hooks/useMyLocation";
import getImagesUrlFromSupabase from "@/lib/functions/getImagesUrlFromSupabase";
import getLinkForContact from "@/lib/functions/getLinkForContact";
import locationToCoords from "@/lib/functions/locationToCoords";
import { RecommendBuzinessButton } from "@/lib/supabase/RecommendBuzinessButton";
import { SaveBuzinessButton } from "@/lib/supabase/SaveBuzinessButton";
import { supabase } from "@/lib/supabase/supabase";
import { storeBuzinessSearchParams } from "@/redux/reducers/buzinessReducer";
import { RootState } from "@/redux/store";
import {
  BuzinessItemInterface,
  ImageDataType,
  UserState,
} from "@/redux/store.type";
import { PostgrestError } from "@supabase/supabase-js";
import {
  Link,
  router,
  useFocusEffect,
  useGlobalSearchParams,
  useNavigation,
} from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, useWindowDimensions, View } from "react-native";
import ImageModal from "react-native-image-modal";
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
// Removed tabs; sections will be stacked vertically
import { useDispatch, useSelector } from "react-redux";
import { MyAppbar } from "@/components/MyAppBar";
import typeToIcon from "@/lib/functions/typeToIcon";
import UrlText from "@/components/comments/UrlText";

export default function Index() {
  const { id: paramId } = useGlobalSearchParams();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const dispatch = useDispatch();
  const { uid: myUid }: UserState = useSelector(
    (state: RootState) => state.user
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
  const location: LatLng | null =
    data?.lat && data?.long
      ? { latitude: data.lat, longitude: data.long }
      : null;
  const categories = data?.title?.split(" $ ");
  const title = categories?.[0];
  const [images, setImages] = useState<ImageDataType[]>([]);

  const myBuziness = myUid === data?.author;
  const { myLocation } = useMyLocation();
  const [commentsCount, setCommentsCount] = useState<number>();

  useFocusEffect(
    useCallback(() => {
      const load = () => {
        setShowRecommendsModal(false);

        if (!id) return;
        supabase
          .from("buziness")
          .select(
            "*, contacts(*), profiles ( full_name, avatar_url ), buzinessRecommendations!buzinessRecommendations_buziness_id_fkey(author)"
          )
          .eq("id", id)
          .maybeSingle()
          .then(({ data, error }) => {
            if (error) {
              console.log(error);
              setError(error);
              return;
            }
            console.log(data?.location);

            if (data) {
              const cords = data?.location
                ? locationToCoords(String(data.location))
                : null;
              setData({
                ...data,
                lat: cords?.[1],
                long: cords?.[0],
                distance: 0,
                authorName: data?.profiles?.full_name || "???",
                avatarUrl: data?.profiles?.avatar_url,
              });
              navigation.setOptions({ header: () => <MyAppbar center={<Text variant="titleLarge">{data?.title?.split(" $ ")[0]}</Text>} style={{ elevation: 0, shadowOpacity: 0, borderBottomWidth: 0 }} /> });

              if (data.images) setImages(getImagesUrlFromSupabase(data.images));
              if (data.defaultContact) {
                if (data.contacts) {
                  setDefaultContact(data.contacts);
                } else {
                  setRequestContanct(true);
                }
              }

              setRecommendations(
                data?.buzinessRecommendations?.map((pr) => pr.author)
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
    }, [id])
  );

  const onPimary = () => {
    if (myBuziness) {
      router.navigate({
        pathname: "/biznisz/edit/[editId]",
        params: { editId: id },
      });
    }
  };
  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flex: 1 }}>
        {!data && !error && <ActivityIndicator />}
        {!!id && !!data && (
          <>
            <View
              style={{
                flexWrap: "wrap",
                flexDirection: "row",
                gap: 4,
                paddingHorizontal: 10,
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
            <CollapsibleText>
              <UrlText text={data.description} />
            </CollapsibleText>
            <View style={{ width: "100%", flexDirection: "row", alignItems: "flex-start" }}>
              <Link
                asChild
                style={{ flex: 1, padding: 8, justifyContent: "center" }}
                href={{ pathname: "/user/[uid]", params: { uid: data.author } }}
              >
                <TouchableRipple>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8
                    }}
                  >
                    <ProfileImage
                      uid={data.author}
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 30,
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
                  justifyContent: "center", padding: 8,
                  paddingLeft: 24,
                  height: 55
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
            <View style={{ flexWrap: "wrap", gap: 4, padding: 4 }}>
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
                  <Button style={{ flex: 1 }} mode="contained-tonal" icon={typeToIcon(defaultContact.type)}>
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
                <View style={{ flexDirection: "row", alignItems: "center" }}>
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
                            recommendations.filter((uid) => uid !== myUid)
                          );
                      }
                    }}
                  />
                  <SaveBuzinessButton
                    buzinessId={id}
                  />
                </View>
              )}
            </View>
            {/* Vertical sections instead of tabs */}
            {data.location && (
              <View style={{ marginTop: 8 }}>
                <Text variant="titleMedium" style={{ marginHorizontal: 8, marginBottom: 6 }}>Helyzete</Text>
                <View style={{ minHeight: 200, flex: 1 }}>
                  <MapView
                    // @ts-expect-error options type are colliding in different mapViews
                    options={{
                      mapTypeControl: false,
                      fullscreenControl: false,
                      streetViewControl: false,
                      zoomControl: false,
                    }}
                    style={{ width: "100%", height: 240 }}
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
                        style={{ justifyContent: "center", alignItems: "center" }}
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
                      style={{ right: 4, bottom: 17, position: "absolute" }}
                    />
                  )}
                </View>
              </View>
            )}

            {images.length > 0 && (
              <View style={{ marginTop: 16 }}>
                <Text variant="titleMedium" style={{ marginHorizontal: 8, marginBottom: 6 }}>Képek</Text>
                {images.map((image, ind) => (
                  <View key={"image-" + ind} style={{ width: "100%" }}>
                    <ImageModal
                      source={{ uri: image.url }}
                      resizeMode="contain"
                      modalImageResizeMode="contain"
                      overlayBackgroundColor="#00000096"
                      style={{ width: width, height: 200 }}
                      renderFooter={() => (
                        <ScrollView style={{ maxHeight: 250 }}>
                          <ThemedText style={{ color: "white", textShadowColor: "black", textShadowRadius: 3 }}>
                            {image.description}
                          </ThemedText>
                        </ScrollView>
                      )}
                    />
                    <View style={{ padding: 4 }}>
                      <CollapsibleText>
                        {image.description}
                      </CollapsibleText>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <View style={{ marginTop: 16 }}>
              <Text variant="titleMedium" style={{ marginHorizontal: 8, marginBottom: 6 }}>Elérhetőségek</Text>
              <ContactList uid={data.author} />
            </View>

            <View style={{ marginTop: 16 }}>
              <Text variant="titleMedium" style={{ marginHorizontal: 8, marginBottom: 6 }}>Vélemények</Text>
              <Comments path={"buziness/" + id} placeholder="Mondd el a véleményed" />
            </View>
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
