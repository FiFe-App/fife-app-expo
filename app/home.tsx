import { router, useFocusEffect } from "expo-router";
import BuzinessItem from "@/components/buziness/BuzinessItem";
import { FiFeRadar } from "@/components/user/FiFeRadar";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Spacing } from "@/constants/spacing";
import { computeUnreadCounts } from "@/lib/functions/computeUnreadCounts";
import { supabase } from "@/lib/supabase/supabase";
import { setUnreadCounts } from "@/redux/reducers/chatReducer";
import { viewFunction } from "@/redux/reducers/tutorialReducer";
import { clearOptions } from "@/redux/reducers/infoReducer";
import { RootState } from "@/redux/store";
import { useCallback, useEffect } from "react";
import { View } from "react-native";
import {
  Badge,
  Card,
  Icon
} from "react-native-paper";
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
  const { lastReadAt, unreadCounts } = useSelector((state: RootState) => state.chat);
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);
  const theme = useAppTheme();
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
        supabase
          .from("messages")
          .select("*")
          .eq("to", uid)
          .then(({ data: incoming, error }) => {
            if (error) {
              console.error("Error loading unread messages:", error);
              return;
            }
            dispatch(setUnreadCounts(computeUnreadCounts(incoming || [], uid, lastReadAt)));
          });
      }
    }, [data.length, nearbyBuzinesses.length, uid, messagingEnabled, lastReadAt, dispatch, fetch, fetchNearby]),
  );

  if (!uid) return null;
  return (
    <ThemedView style={{ flex: 1, minHeight: 0 }} type="default">
      <ScrollView
        style={{ flex: 1, minHeight: 0 }}
        stickyHeaderIndices={[messagingEnabled ? 2 : 2]}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: Spacing.xxl }}
      >
        {messagingEnabled && (
          <Card
            style={{
              marginHorizontal: Spacing.sm,
              marginTop: Spacing.sm,
              marginBottom: Spacing.sm,
              paddingHorizontal: Spacing.lg,
              paddingVertical: Spacing.sm,
              borderRadius: 12,
            }}
            contentStyle={{
              gap: Spacing.xs,
              flexDirection: "row",
            }}
          >
            <Icon size={18} color={theme.colors.primary} source="message" />
            <ThemedText
              variant="labelLarge"
              type="bold"
              onPress={() => router.push("/chats")}
              style={{ color: theme.colors.primary }}
            >
              Üzeneteid
            </ThemedText>
            {totalUnread > 0 && (
              <Badge size={20} style={{ backgroundColor: theme.colors.error }}>
                {totalUnread}
              </Badge>
            )}
          </Card>
        )}
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
        <View style={{ paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, paddingBottom: Spacing.xl }}>
          {nearbyBuzinesses.map((buziness, index) => (
            <View
              key={buziness.id}
              style={{ marginBottom: index === nearbyBuzinesses.length - 1 ? 0 : Spacing.sm }}
            >
              <BuzinessItem data={buziness} />
            </View>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}
