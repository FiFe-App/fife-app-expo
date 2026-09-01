import { router, useFocusEffect } from "expo-router";
import BuzinessItem from "@/components/buziness/BuzinessItem";
import { FiFeRadar } from "@/components/user/FiFeRadar";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Spacing } from "@/constants/spacing";
import { fetchUnreadCounts } from "@/lib/chat/fetchUnreadCounts";
import { setUnreadCounts } from "@/redux/reducers/chatReducer";
import { viewFunction } from "@/redux/reducers/tutorialReducer";
import { clearOptions } from "@/redux/reducers/infoReducer";
import { RootState } from "@/redux/store";
import { useCallback, useEffect } from "react";
import { Pressable, View } from "react-native";
import { Icon } from "react-native-paper";
import { ScrollView } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import InviteCard from "@/components/InviteCard";
import { useFifeSearch } from "@/hooks/useFifeSearch";
import { useNearbyBuzinesses } from "@/hooks/useNearbyBuzinesses";
import { useAppTheme } from "@/assets/theme";

export default function Index() {
  const { uid, messagingEnabled } = useSelector((state: RootState) => state.user);
  const searchCircle = useSelector(
    (state: RootState) => state.users.userSearchParams?.searchCircle,
  );
  const { lastReadAt } = useSelector((state: RootState) => state.chat);
  const theme = useAppTheme();
  const dispatch = useDispatch();

  const { fetch, data, fetchNextPage, hasMore, error, loading } = useFifeSearch();
  const {
    data: nearbyBuzinesses,
    fetch: fetchNearby,
    fetchNextPage: fetchNearbyNext,
    loading: buzinessesLoading,
    error: buzinessError,
  } = useNearbyBuzinesses();

  useEffect(() => {
    fetch();
  }, [searchCircle, fetch]);

  useEffect(() => {
    return () => {
      dispatch(clearOptions());
    };
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {

      if (data.length === 0) {
        fetch();
      }
      if (nearbyBuzinesses.length === 0) {
        fetchNearby();
      }
      if (uid) dispatch(viewFunction({ key: "homePage", uid }));

      if (uid && messagingEnabled) {
        fetchUnreadCounts(uid, lastReadAt).then((counts) => {
          if (counts) dispatch(setUnreadCounts(counts));
        });
      }
    }, [data.length, nearbyBuzinesses.length, uid, messagingEnabled, lastReadAt, dispatch, fetch, fetchNearby]),
  );

  if (!uid) return null;

  // Index of the "Bizniszek" header among the ScrollView's children.
  const stickyHeaderIndex = 1;

  return (
    <ThemedView style={{ flex: 1, minHeight: 0 }} type="default">
      <ScrollView
        style={{ flex: 1, minHeight: 0 }}
        stickyHeaderIndices={[stickyHeaderIndex]}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: Spacing.xxl }}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const distanceFromBottom =
            contentSize.height - contentOffset.y - layoutMeasurement.height;
          if (distanceFromBottom < 300) fetchNearbyNext();
        }}
        scrollEventThrottle={200}
      >
        <FiFeRadar
          data={data}
          load={fetchNextPage}
          canLoadMore={hasMore}
          loading={loading}
          error={error}
        />
        <ThemedView
          style={{
            paddingHorizontal: Spacing.lg,
            paddingVertical: Spacing.sm,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between", 
            backgroundColor: theme.colors.background
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: Spacing.xs }}>
            <ThemedText variant="labelLarge" type="bold" style={{ color: theme.colors.secondary }}>
              {searchCircle ? "Közeli" : "Budapesti"} Bizniszek
            </ThemedText>
            <Icon size={18} color={theme.colors.secondary} source="map-marker" />
            <Pressable onPress={()=>router.push("/search")} style={{ flex:1, flexDirection: "row", alignItems: "center", justifyContent:"flex-end", gap: Spacing.xs }}>
              <ThemedText variant="labelMedium" type="bold" style={{ color: theme.colors.primary }}>
                Keresés
              </ThemedText>
              <Icon size={18} color={theme.colors.primary} source="chevron-right" />
            </Pressable>
          </View>
        </ThemedView>
        {!!buzinessError && (
          <ThemedView style={{ margin: 6, alignItems: "center" }} type="error">
            <ThemedText type="error">{buzinessError}</ThemedText>
          </ThemedView>
        )}
        <View style={{ paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, paddingBottom: Spacing.xl }}>
          {nearbyBuzinesses.map((buziness, index) => (
            <View
              key={buziness.id}
              style={{ marginBottom: index === nearbyBuzinesses.length - 1 ? 0 : Spacing.sm }}
            >
              <BuzinessItem data={buziness} />
            </View>
          ))}
          {buzinessesLoading && nearbyBuzinesses.length > 0 && (
            <ActivityIndicator style={{ marginTop: Spacing.md }} />
          )}
        </View>
      </ScrollView>
      <InviteCard />
    </ThemedView>
  );
}
