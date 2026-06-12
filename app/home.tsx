import { theme } from "@/assets/theme";
import BuzinessItem from "@/components/buziness/BuzinessItem";
import { FiFeRadar } from "@/components/user/FiFeRadar";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Spacing } from "@/constants/spacing";
import { viewFunction } from "@/redux/reducers/tutorialReducer";
import { RootState } from "@/redux/store";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect } from "react";
import { ScrollView, View } from "react-native";
import { ActivityIndicator, Icon } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { useFifeSearch } from "@/hooks/useFifeSearch";
import { useNearbyBuzinesses } from "@/hooks/useNearbyBuzinesses";

export default function Index() {
  const { uid } = useSelector((state: RootState) => state.user);
  const searchCircle = useSelector(
    (state: RootState) => state.users.userSearchParams?.searchCircle,
  );
  const dispatch = useDispatch();

  const { fetch, data, fetchNextPage, hasMore, error, loading } = useFifeSearch();
  const {
    data: nearbyBuzinesses,
    fetch: fetchNearby,
    loading: buzinessesLoading,
    error: buzinessError,
  } = useNearbyBuzinesses();

  useEffect(() => {
    fetch();
  }, [searchCircle]);

  useFocusEffect(
    useCallback(() => {
      if (data.length === 0) {
        fetch();
      }
      if (nearbyBuzinesses.length === 0) {
        fetchNearby();
      }
      if (uid) dispatch(viewFunction({ key: "homePage", uid }));
    }, [data.length, nearbyBuzinesses.length, uid, dispatch, fetch, fetchNearby]),
  );

  if (!uid) return null;
  return (
    <ThemedView style={{ flex: 1 }} type="default">
      <ScrollView contentContainerStyle={{ paddingBottom: Spacing.xl }}>
        <FiFeRadar
          data={data}
          load={fetchNextPage}
          canLoadMore={hasMore}
          loading={loading}
          error={error}
        />
        <ThemedView
          type="card"
          style={{
            paddingHorizontal: Spacing.lg,
            paddingVertical: Spacing.sm,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor:theme.colors.background
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: Spacing.xs }}>
            <ThemedText variant="labelLarge" type="bold" style={{ color: theme.colors.secondary }}>
              Közeli Bizniszek
            </ThemedText>
            <Icon size={18} color={theme.colors.secondary} source="map-marker" />
          </View>
        </ThemedView>
        {!!buzinessError && (
          <ThemedView style={{ margin: 6, alignItems: "center" }} type="error">
            <ThemedText type="error">{buzinessError}</ThemedText>
          </ThemedView>
        )}
        <View style={{ gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm }}>
          {nearbyBuzinesses.map((buziness) => (
            <BuzinessItem key={buziness.id} data={buziness} />
          ))}
          {buzinessesLoading && !nearbyBuzinesses.length && (
            <ActivityIndicator style={{ padding: Spacing.lg }} />
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}
