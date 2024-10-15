import MyLocationIcon from "@/assets/images/myLocationIcon";
import { ThemedView } from "@/components/ThemedView";
import { ContactList } from "@/components/buziness/ContactList";
import Comments from "@/components/comments/Comments";
import { LatLng, MapView, Marker } from "@/components/mapView/mapView";
import { useMyLocation } from "@/hooks/useMyLocation";
import { storeBuzinessSearchParams } from "@/lib/redux/reducers/buzinessReducer";
import { RootState } from "@/lib/redux/store";
import { BuzinessItemInterface, UserState } from "@/lib/redux/store.type";
import { RecommendBuzinessButton } from "@/lib/supabase/RecommendBuzinessButton";
import { supabase } from "@/lib/supabase/supabase";
import {
  Link,
  router,
  useFocusEffect,
  useGlobalSearchParams,
  useNavigation,
} from "expo-router";
import { useCallback, useState } from "react";
import { View } from "react-native";
import openMap from "react-native-open-maps";
import {
  ActivityIndicator,
  Button,
  Chip,
  IconButton,
  Text,
  TouchableRipple,
} from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";

export default function Index() {
  const { id: paramId } = useGlobalSearchParams();
  const dispatch = useDispatch();
  const { uid: myUid }: UserState = useSelector(
    (state: RootState) => state.user,
  );

  const id: number = Number(paramId);
  const [data, setData] = useState<BuzinessItemInterface | undefined>();
  const [recommended, setRecommended] = useState(false);
  const location: LatLng | null = data
    ? { latitude: data.lat, longitude: data.long }
    : null;
  const categories = data?.title?.split(" ");
  const title = categories?.[0];
  const myBuziness = myUid === data?.author;
  const { myLocation, error } = useMyLocation();
  const nav = useNavigation();

  useFocusEffect(
    useCallback(() => {
      const load = () => {
        if (!id) return;
        supabase
          .from("buziness")
          .select(
            "*, profiles ( full_name, avatar_url ), buzinessRecommendations ( count )",
          )
          .eq("id", id)
          .then(({ data, error }) => {
            if (error) {
              console.log(error);
              return;
            }
            if (data) {
              var Buffer = require("@craftzdog/react-native-buffer").Buffer;
              console.log("Buffer", Buffer);
              var wkx = require("wkx");

              var wkbBuffer = new Buffer(data[0].location, "hex");
              var geometry = wkx.Geometry.parse(wkbBuffer);

              const cords = geometry.toGeoJSON().coordinates;
              nav.setOptions({ title: data[0]?.title.split(" ")[0] });
              setData({
                ...data[0],
                lat: cords[1],
                long: cords[0],
                distance: 0,
                authorName: data[0]?.profiles?.full_name || "???",
                recommendations: data[0].buzinessRecommendations[0].count,
              });
            }
          });
        if (myUid) {
          supabase
            .from("buzinessRecommendations")
            .select("count")
            .eq("author", myUid)
            .eq("buziness_id", id)
            .then((res) => {
              setRecommended(!!res.data?.[0].count);
            });
        }
      };
      load();
      return () => {};
    }, [id]),
  );

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
      {!data && <ActivityIndicator />}
      {id && data && (
        <>
          <View style={{ flexDirection: "row" }}>
            <Link
              asChild
              style={{ flex: 1, padding: 20 }}
              href={{ pathname: "/user/[uid]", params: { uid: data.author } }}
            >
              <TouchableRipple>
                <Text style={{ textAlign: "center" }}>
                  {data.authorName} biznisze
                </Text>
              </TouchableRipple>
            </Link>
            <Text style={{ flex: 1, textAlign: "center", padding: 20 }}>
              {data.recommendations} ajánlás
            </Text>
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
                    <Text>{e}</Text>
                  </Chip>
                );
            })}
          </View>
          <View style={{ padding: 10 }}>
            <Text>{data?.description}</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 4, padding: 4 }}>
            <Button style={{ flex: 1 }} mode="contained" onPress={onPimary}>
              {myBuziness ? "Szerkesztés" : "Írok neki!"}
            </Button>
            {!myBuziness && (
              <RecommendBuzinessButton
                buzinessId={id}
                recommended={recommended}
                setRecommended={setRecommended}
              />
            )}
          </View>
          <ContactList uid={data.author} />
          <Text>Hol található?</Text>
          <MapView
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
            googleMapsApiKey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}
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
          </MapView>
          <Comments
            path={"buziness/" + id}
            placeholder="Mondd el a véleményed"
          />
        </>
      )}
    </ThemedView>
  );
}
