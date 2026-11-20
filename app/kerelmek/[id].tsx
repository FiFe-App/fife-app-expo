import NewMarkerIcon from "@/assets/images/newMarkerIcon";
import { Button } from "@/components/Button";
import Comments from "@/components/comments/Comments";
import ErrorScreen from "@/components/ErrorScreen";
import FiFeMap from "@/components/mapView/FiFeMap";
import { Marker } from "@/components/mapView/mapView";
import CategoryChip from "@/components/CategoryChip";
import MetaStat from "@/components/MetaStat";
import { RequestBadges } from "@/components/requests/RequestCard";
import RequestHeaderInfo from "@/components/requests/RequestHeaderInfo";
import { useRequestActions, useSolveRequest } from "@/components/requests/RequestMenu";
import { MyAppbar } from "@/components/MyAppBar";
import { clearOptions, setOptions } from "@/redux/reducers/infoReducer";
import SupabaseImage from "@/components/SupabaseImage";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import UrlText from "@/components/UrlText";
import { BorderRadius } from "@/constants/borderRadius";
import { Spacing } from "@/constants/spacing";
import { useMyLocation } from "@/hooks/useMyLocation";
import getDistance from "@/lib/functions/getDistance";
import locationToCoords from "@/lib/functions/locationToCoords";
import { requestAge, requestPlaceText } from "@/lib/requests/format";
import { leaveRequest } from "@/lib/requests/navigation";
import { REQUESTS_BUCKET } from "@/lib/requests/requestImages";
import { supabase } from "@/lib/supabase/supabase";
import { RootState } from "@/redux/store";
import { Tables } from "@/database.types";
import { Stack, useFocusEffect, useLocalSearchParams, useNavigation } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { ActivityIndicator, Surface, Text } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";

type RequestRow = Omit<Tables<"requests">, "embedding" | "embedding_text"> & {
  profiles: { full_name: string | null; avatar_url: string | null } | null;
};

export default function RequestScreen() {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { id: idParam } = useLocalSearchParams<{ id: string }>();
  const id = Number(idParam);
  const uid = useSelector((state: RootState) => state.user.uid);
  const { myLocation } = useMyLocation();

  const [data, setData] = useState<RequestRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const validId = Number.isFinite(id);

  const load = useCallback(async () => {
    const { data: row, error } = await supabase
      .from("requests")
      // Explicit columns: the embedding columns are server-side only and large.
      .select(
        "id, created_at, author, title, description, tags, images, location, radius, status, solved_at, profiles(full_name, avatar_url)",
      )
      .eq("id", id)
      .maybeSingle();
    if (error || !row) {
      setNotFound(true);
    } else {
      setNotFound(false);
      setData(row as unknown as RequestRow);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    // Fetching on mount is the point of the effect; the setState happens after the await.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (validId) load();
  }, [validId, load]);

  const solve = useSolveRequest(load);

  // The row holds the place as hex EWKB, like every other geography column.
  const coords = useMemo(() => {
    if (!data?.location) return null;
    try {
      const [long, lat] = locationToCoords(String(data.location));
      return Number.isFinite(lat) && Number.isFinite(long) ? { lat, long } : null;
    } catch {
      return null;
    }
  }, [data]);

  const mine = !!data && data.author === uid;
  const solved = data?.status === "solved";
  const authorName = data?.profiles?.full_name ?? null;
  const distance =
    coords && myLocation
      ? getDistance(
          myLocation.coords.latitude,
          myLocation.coords.longitude,
          coords.lat,
          coords.long,
        )
      : null;
  const place = requestPlaceText({
    lat: coords?.lat ?? null,
    long: coords?.long ?? null,
    distance,
  });

  // The ⋮ menu of the app bar (info.options): solve / delete for the author, report / block for
  // everyone else. The dialogs those open are rendered at the bottom of this screen.
  const { items, modals } = useRequestActions(
    {
      id: data?.id ?? id,
      author: data?.author ?? "",
      author_name: authorName,
      title: data?.title ?? "",
      description: data?.description ?? "",
      images: data?.images ?? [],
      status: data?.status ?? "open",
    },
    { onDeleted: leaveRequest, onBlocked: leaveRequest, onSolved: load },
  );
  // The options outlive a render, so what they call is read from here when they are pressed.
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  });
  const itemTitles = items.map((item) => item.title).join("|");
  useFocusEffect(
    useCallback(() => {
      if (!itemTitles) {
        dispatch(clearOptions());
        return;
      }
      dispatch(
        setOptions(
          itemTitles.split("|").map((title) => {
            const item = itemsRef.current.find((i) => i.title === title);
            return {
              title,
              icon: item?.icon ?? "dots-vertical",
              onPress: () => itemsRef.current.find((i) => i.title === title)?.onPress(),
            };
          }),
        ),
      );
      return () => {
        dispatch(clearOptions());
      };
    }, [dispatch, itemTitles]),
  );

  // Back arrow, who asked / when / where, the ⋮ menu: the app bar is this request's header.
  const headerAuthor = data?.author;
  const headerAvatar = data?.profiles?.avatar_url;
  const headerAge = data ? requestAge(data.created_at) : "";
  useEffect(() => {
    if (!headerAuthor) return;
    navigation.setOptions({
      header: () => (
        <MyAppbar
          center={
            <RequestHeaderInfo
              authorId={headerAuthor}
              name={headerAuthor === uid ? "Te" : (authorName ?? "Törölt felhasználó")}
              avatarUrl={headerAvatar}
              age={headerAge}
              place={place}
            />
          }
        />
      ),
    });
  }, [navigation, headerAuthor, headerAvatar, headerAge, authorName, place, uid]);

  if (validId && loading) {
    return (
      <ThemedView style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (!validId || notFound || !data) {
    return (
      <>
        <Stack.Screen options={{ title: "Kérés" }} />
        <ErrorScreen
          icon="hand-heart-outline"
          title="Nem találjuk ezt a kérést"
          text="Lehet, hogy a készítője törölte, vagy nem érhető el."
          action={<Button mode="contained-tonal" onPress={leaveRequest}>Vissza a kérésekhez</Button>}
        />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Kérés" }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ThemedView style={{ flex: 1 }}>
          <ScrollView
            testID="request-detail"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xxl }}
          >
            <Surface elevation={2} style={{ borderRadius: BorderRadius.lg, padding: Spacing.md, gap: Spacing.md }}>
              <View style={{ gap: Spacing.sm }}>
                <Text variant="titleLarge">{data.title}</Text>
                <RequestBadges solved={solved} match={false} />
                {!!data.description && (
                  <UrlText text={data.description} style={{ fontSize: 16, lineHeight: 24 }} />
                )}
              </View>

              {data.images?.map((path) => (
                <SupabaseImage
                  key={path}
                  bucket={REQUESTS_BUCKET}
                  path={path}
                  modal
                  resizeMode="cover"
                  style={{ width: "100%", aspectRatio: 4 / 3, borderRadius: BorderRadius.md }}
                />
              ))}

              {data.tags?.length > 0 && (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs }}>
                  {data.tags.map((tag) => (
                    <CategoryChip key={tag}>{tag}</CategoryChip>
                  ))}
                </View>
              )}

              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: Spacing.md }}>
                <MetaStat icon={coords ? "map-marker" : "wifi"}>
                  {coords ? place : "Bárhol"}
                </MetaStat>
                {coords && !!data.radius && (
                  <MetaStat icon="radius-outline">
                    {Math.round(data.radius / 100) / 10} km-es körzetből
                  </MetaStat>
                )}
              </View>

              {coords && (
                <View style={{ borderRadius: BorderRadius.md, overflow: "hidden", height: 160 }}>
                  <FiFeMap
                    zoomControlEnabled={false}
                    scrollEnabled={false}
                    initialCamera={{ center: { latitude: coords.lat, longitude: coords.long } }}
                    style={{ width: "100%", height: 160 }}
                  >
                    <Marker
                      coordinate={{ latitude: coords.lat, longitude: coords.long }}
                      anchor={{ x: 0.5, y: 0.5 }}
                    >
                      <NewMarkerIcon width={24} height={24} />
                    </Marker>
                  </FiFeMap>
                </View>
              )}

              {mine && !solved && (
                <Button
                  testID="request-solve"
                  mode="contained"
                  icon="check-circle-outline"
                  onPress={() => solve(data)}
                >
                  Megoldva
                </Button>
              )}
            </Surface>

            <View>
              <ThemedText variant="titleMedium" style={{ paddingBottom: Spacing.sm }}>
                Hozzászólások
              </ThemedText>
              <Comments
                path={"request/" + data.id}
                placeholder={mine ? "Válaszolj…" : "Tudsz segíteni? Írj hozzászólást!"}
                closed={solved}
                closedText="A kérés megoldódott, ezért új hozzászólást már nem lehet írni."
              />
            </View>
          </ScrollView>
        </ThemedView>
      </KeyboardAvoidingView>
      {modals}
    </>
  );
}
