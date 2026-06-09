import MyLocationIcon from "@/assets/images/myLocationIcon";
import { useAppTheme } from "@/assets/theme";
import CollapsibleText from "@/components/CollapsibleText";
import ErrorScreen from "@/components/ErrorScreen";
import ProfileImage from "@/components/ProfileImage";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import BuzinessRecommendationsModal from "@/components/buziness/BuzinessRecommendationsModal";
import ContactsCard from "@/components/buziness/ContactsCard";
import SectionLabel from "@/components/buziness/SectionLabel";
import Comments from "@/components/comments/Comments";
import UrlText from "@/components/comments/UrlText";
import FiFeMap from "@/components/mapView/FiFeMap";
import { LatLng, Marker } from "@/components/mapView/mapView";
import { MyAppbar } from "@/components/MyAppBar";
import CategoryChip from "@/components/CategoryChip";
import { BorderRadius } from "@/constants/borderRadius";
import { Spacing } from "@/constants/spacing";
import { Tables } from "@/database.types";
import { useMyLocation } from "@/hooks/useMyLocation";
import elapsedTime from "@/lib/functions/elapsedTime";
import toDistanceText from "@/lib/functions/distanceText";
import getDistance from "@/lib/functions/getDistance";
import getImagesUrlFromSupabase from "@/lib/functions/getImagesUrlFromSupabase";
import getLinkForContact from "@/lib/functions/getLinkForContact";
import locationToCoords from "@/lib/functions/locationToCoords";
import typeToIcon from "@/lib/functions/typeToIcon";
import { RecommendBuzinessButton } from "@/lib/supabase/RecommendBuzinessButton";
import { SaveBuzinessButton } from "@/lib/supabase/SaveBuzinessButton";
import { supabase } from "@/lib/supabase/supabase";
import { clearOptions, setOptions } from "@/redux/reducers/infoReducer";
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
  Stack,
  useFocusEffect,
  useGlobalSearchParams,
} from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, useWindowDimensions, View } from "react-native";
import ImageModal from "react-native-image-modal";
import openMap from "react-native-open-maps";
import {
  ActivityIndicator,
  Button,
  IconButton,
  Portal,
  Surface,
  Text,
  TouchableRipple,
} from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";

const StatDivider = () => {
  const theme = useAppTheme();
  return (
    <View
      style={{
        width: 1,
        backgroundColor: theme.colors.outlineVariant,
        marginVertical: Spacing.xs,
      }}
    />
  );
};

const StatItem = ({
  value,
  label,
  onPress,
}: {
  value: string | number | null;
  label: string;
  onPress?: () => void;
}) => {
  const theme = useAppTheme();
  const inner = (
    <View style={{ alignItems: "center", paddingVertical: Spacing.xs }}>
      <Text variant="headlineSmall" style={{ fontWeight: "700", color: theme.colors.primary }}>
        {value}
      </Text>
      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
        {label}
      </Text>
    </View>
  );
  return onPress ? (
    <TouchableRipple
      onPress={onPress}
      style={{ flex: 1, alignItems: "center", borderRadius: BorderRadius.md }}
    >
      {inner}
    </TouchableRipple>
  ) : (
    <View style={{ flex: 1 }}>{inner}</View>
  );
};

export default function Index() {
  const theme = useAppTheme();
  const { height: windowHeight } = useWindowDimensions();
  const { id: paramId } = useGlobalSearchParams();
  const dispatch = useDispatch();
  const { uid: myUid }: UserState = useSelector(
    (state: RootState) => state.user
  );
  const id: number = Number(paramId);
  const [data, setData] = useState<BuzinessItemInterface | undefined>();
  const [defaultContact, setDefaultContact] =
    useState<Tables<"contacts"> | null>();
  const [contacts, setContacts] = useState<Tables<"contacts">[]>([]);

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
  const isNew = data?.created_at && new Date().getTime() - new Date(data.created_at).getTime() < 1000 * 60 * 60 * 24 * 10;

  const scrollRef = useRef<ScrollView>(null);
  const [tab, setTab] = useState<"overview" | "reviews">("overview");
  // Height of the (non-sticky) header block. Since it sits at y=0, its height
  // equals the sticky tab bar's scroll offset. Measuring the header instead of
  // the sticky tab bar avoids reading a translated/stale Y from the sticky node.
  const [headerHeight, setHeaderHeight] = useState(0);
  const tabBarY = headerHeight + Spacing.xl; // header block has marginBottom: Spacing.xl

  const goToTab = (next: "overview" | "reviews") => {
    setTab(next);
    // allow the new tab content to mount/lay out before scrolling to the tab bar
    setTimeout(() => scrollRef.current?.scrollTo({ y: tabBarY, animated: true }), 50);
  };

  const goToMap = () => {
    setTab("overview");
    // allow the overview tab to mount/lay out before scrolling to the map (last element)
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  };

  const distanceMeters =
    myLocation && location
      ? getDistance(
          myLocation.coords.latitude,
          myLocation.coords.longitude,
          location.latitude,
          location.longitude
        )
      : null;
  const distanceText =
    distanceMeters != null ? toDistanceText(distanceMeters / 1000) : null;

  useEffect(() => {
    if (myBuziness)
      dispatch(
        setOptions([
          {
            title: "Mentés",
            icon: "pencil",
            onPress: async () => {
              router.push("/biznisz/edit/" + id);
            },
          },
        ]),
      );
    return () => {
      dispatch(clearOptions());
    };
  }, [dispatch, id, myBuziness]);

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
              if (data.images) setImages(getImagesUrlFromSupabase(data.images));
              if (data.defaultContact) {
                if (data.contacts) {
                  setDefaultContact(data.contacts);
                }
              }

              setRecommendations(
                data?.buzinessRecommendations?.map((pr) => pr.author)
              );

              if (data.author)
                supabase
                  .from("contacts")
                  .select("*")
                  .eq("author", data.author)
                  .then((res) => {
                    const fetched = res.data ?? [];
                    if (fetched.length > 0) {
                      setContacts(fetched);
                    } else if (data.contacts) {
                      setContacts([data.contacts]);
                    } else {
                      setContacts([]);
                    }
                  });
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

  return (
    <>
      <Stack.Screen options={{
        header: () => <MyAppbar
          title="Biznisz"
          style={{ elevation: 0, shadowOpacity: 0, borderBottomWidth: 0 }} />
      }} />
      <ThemedView style={{ flex: 1 }}>
        {!data && !error && (
          <View style={{ paddingTop: Spacing.xxxl, alignItems: "center" }}>
            <ActivityIndicator />
          </View>
        )}
        {!!error && (
          <ErrorScreen
            icon="briefcase-off"
            title={error.code}
            text={error.message}
          />
        )}
        {!!id && !!data && (
          <ScrollView
            ref={scrollRef}
            stickyHeaderIndices={[1]}
            contentContainerStyle={{ paddingBottom: Spacing.xxl, minHeight: windowHeight+ 100 }}
          >
            {/* HEADER (index 0) */}
            <View
              style={{ marginBottom: Spacing.xl }}
              onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
            >
              {/* HERO */}
              <ThemedView
                style={{
                  paddingHorizontal: Spacing.md,
                  paddingTop: Spacing.xxl,
                  gap: Spacing.xl,
                }}
              >
                {/* Title + chips + byline */}
                <View style={{ gap: Spacing.sm }}>
                  <ThemedText variant="headlineLarge">{title}</ThemedText>

                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      gap: Spacing.xs,
                    }}
                  >
                    {!!isNew && (
                      <CategoryChip key="category-new" style={{ backgroundColor: theme.colors.tertiary }} textStyle={{ color: theme.colors.onTertiary }}>új</CategoryChip>
                    )}
                    {!!data.ingyen && (
                      <CategoryChip key="category-ingyen" style={{ backgroundColor: theme.colors.nature }} textStyle={{ color: theme.colors.onNature }}>ingyenes</CategoryChip>
                    )}
                    {categories?.slice(1).map((e, i) => {
                      if (e.trim())
                        return (
                          <CategoryChip key={"category" + i}>{e}</CategoryChip>
                        );
                    })}
                  </View>

                  <Link
                    asChild
                    href={{ pathname: "/user/[uid]", params: { uid: data.author } }}
                  >
                    <TouchableRipple style={{ borderRadius: BorderRadius.sm, alignSelf: "flex-start" }}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: Spacing.xs,
                          paddingVertical: Spacing.xs,
                        }}
                      >
                        <ProfileImage
                          uid={data.author}
                          style={{ width: 24, height: 24, borderRadius: BorderRadius.full }}
                          avatar_url={data.avatarUrl}
                        />
                        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                          {data.authorName} biznisze
                        </Text>
                      </View>
                    </TouchableRipple>
                  </Link>
                </View>

                {/* Description */}
                {!!data.description && (
                  <CollapsibleText style={{ paddingHorizontal: 0, paddingVertical: Spacing.xs }}>
                    <UrlText text={data.description} style={{ fontSize: 15, lineHeight: 22 }} />
                  </CollapsibleText>
                )}

                {/* Stats card */}
                <Surface
                  style={{
                    flexDirection: "row",
                    borderRadius: BorderRadius.lg,
                    paddingVertical: Spacing.md,
                    paddingHorizontal: Spacing.lg,
                    width: "100%",
                  }}
                  elevation={1}
                >
                  <StatItem
                    value={recommendations?.length ?? 0}
                    label="Ajánlás"
                    onPress={
                      recommendations?.length
                        ? () => setShowRecommendsModal(true)
                        : undefined
                    }
                  />

                  <StatDivider />

                  <StatItem
                    value={commentsCount ?? 0}
                    label="Vélemény"
                    onPress={() => goToTab("reviews")}
                  />

                  {distanceText ? (
                    <>
                      <StatDivider />
                      <StatItem
                        value={distanceText}
                        label="Távolság"
                        onPress={data.location ? goToMap : undefined}
                      />
                    </>
                  ) : data.created_at ? (
                    <>
                      <StatDivider />
                      <StatItem
                        value={elapsedTime(Date.parse(data.created_at.toString()))}
                        label="Kora"
                      />
                    </>
                  ) : null}
                </Surface>

                {/* Primary CTA + secondary actions */}
                <View style={{ gap: Spacing.sm }}>
                  {myBuziness ? (
                    <Link asChild href={{ pathname: "/biznisz/edit/[editId]", params: { editId: id } }}>
                      <Button
                        mode="contained-tonal"
                        icon="pencil"
                        style={{ borderRadius: BorderRadius.pill, width: "100%" }}
                      >
                        Biznisz szerkesztése
                      </Button>
                    </Link>
                  ) : defaultContact ? (
                    <Link asChild href={getLinkForContact(defaultContact)}>
                      <Button
                        mode="contained"
                        icon={typeToIcon(defaultContact.type)}
                        contentStyle={{ height: 50 }}
                        labelStyle={{ fontSize: 16 }}
                        style={{ borderRadius: BorderRadius.pill, width: "100%" }}
                      >
                        {defaultContact.title || defaultContact?.data}
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      mode="contained"
                      icon="card-account-phone"
                      contentStyle={{ height: 50 }}
                      labelStyle={{ fontSize: 16 }}
                      style={{ borderRadius: BorderRadius.pill, width: "100%" }}
                      disabled={contacts.length === 0}
                      onPress={() => goToTab("overview")}
                    >
                      Kapcsolat
                    </Button>
                  )}

                  {!myBuziness && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm }}>
                      <RecommendBuzinessButton
                        buzinessId={id}
                        mode="outlined"
                        style={{ flex: 1, borderRadius: BorderRadius.pill }}
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
                      <SaveBuzinessButton buzinessId={id} />
                    </View>
                  )}
                </View>
              </ThemedView>

              {/* IMAGES — horizontal carousel */}
              {images.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginTop: Spacing.xl }}
                  contentContainerStyle={{ paddingHorizontal: Spacing.md, gap: Spacing.sm }}
                >
                  {images.map((image, ind) => (
                    <View key={"image-" + ind} style={{ width: 160 }}>
                      <ImageModal
                        source={{ uri: image.url }}
                        resizeMode="cover"
                        modalImageResizeMode="contain"
                        overlayBackgroundColor="#00000096"
                        style={{ width: 160, height: 160, borderRadius: BorderRadius.lg }}
                        renderFooter={() => (
                          <ScrollView style={{ maxHeight: 250 }}>
                            <ThemedText style={{ color: "white", textShadowColor: "black", textShadowRadius: 3 }}>
                              {image.description}
                            </ThemedText>
                          </ScrollView>
                        )}
                      />
                      {!!image.description && (
                        <Text
                          variant="labelSmall"
                          numberOfLines={1}
                          style={{ color: theme.colors.onSurfaceVariant, paddingTop: Spacing.xs }}
                        >
                          {image.description}
                        </Text>
                      )}
                    </View>
                  ))}
                </ScrollView>
              )}

            </View>

            {/* TAB BAR (sticky index 1) */}
            <View>
              <View
                style={{
                  flexDirection: "row",
                  backgroundColor: theme.colors.background,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.colors.outlineVariant,
                }}
              >
                {(
                  [
                    { key: "overview", label: "Áttekintés" },
                    {
                      key: "reviews",
                      label: commentsCount
                        ? `Vélemények (${commentsCount})`
                        : "Vélemények",
                    },
                  ] as const
                ).map((t) => {
                  const active = tab === t.key;
                  return (
                    <TouchableRipple key={t.key} style={{ flex: 1 }} onPress={() => setTab(t.key)}>
                      <View
                        style={{
                          alignItems: "center",
                          paddingVertical: Spacing.md,
                          borderBottomWidth: 2,
                          borderBottomColor: active ? theme.colors.primary : "transparent",
                        }}
                      >
                        <Text
                          variant="labelLarge"
                          style={{ color: active ? theme.colors.onSurface : theme.colors.onSurfaceVariant }}
                        >
                          {t.label}
                        </Text>
                      </View>
                    </TouchableRipple>
                  );
                })}
              </View>
            </View>

            {/* TAB CONTENT (index 2) */}
            {/* minHeight keeps the content below the sticky tab bar at least a
                screenful tall, so jumping to a tab can always scroll the tab
                bar up to the top even when a tab's content is short. */}
            <View style={{ paddingTop: Spacing.xl }}>
              {tab === "overview" ? (
                <View style={{ gap: Spacing.xl }}>
                  {contacts.length > 0 && (
                    <View style={{ paddingHorizontal: Spacing.md, gap: Spacing.sm }}>
                      <SectionLabel label="Elérhetőségek" />
                      <ContactsCard contacts={contacts} />
                    </View>
                  )}

                  {!!data.location && (
                    <View style={{ paddingHorizontal: Spacing.md, gap: Spacing.sm }}>
                      <SectionLabel label="Helyzete" />
                      <View
                        style={{
                          height: 240,
                          borderRadius: BorderRadius.lg,
                          overflow: "hidden",
                        }}
                      >
                        <FiFeMap
                          style={{ width: "100%", height: "100%" }}
                          initialCamera={location ? { center: location } : undefined}
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
                        </FiFeMap>
                        {location && (
                          <IconButton
                            icon="directions"
                            containerColor={theme.colors.secondary}
                            iconColor={theme.colors.onSecondary}
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
                            style={{ right: Spacing.xs, bottom: Spacing.xs, position: "absolute" }}
                          />
                        )}
                      </View>
                    </View>
                  )}

                  {contacts.length === 0 && !data.location && (
                    <ThemedText
                      style={{
                        textAlign: "center",
                        color: theme.colors.onSurfaceVariant,
                        padding: Spacing.lg,
                      }}
                    >
                      Nincs megadva elérhetőség vagy helyszín.
                    </ThemedText>
                  )}
                </View>
              ) : (
                <View style={{ paddingHorizontal: Spacing.md }}>
                  <Comments path={"buziness/" + id} placeholder="Mondd el a véleményed" />
                </View>
              )}
            </View>
          </ScrollView>
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
      </ThemedView>
    </>
  );
}
