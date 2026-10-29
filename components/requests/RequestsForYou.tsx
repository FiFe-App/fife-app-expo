import { useAppTheme } from "@/assets/theme";
import { Spacing } from "@/constants/spacing";
import { useRequests } from "@/hooks/useRequests";
import { storeRequestSearchText } from "@/redux/reducers/requestsReducer";
import { RootState } from "@/redux/store";
import { router, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { FlatList, Pressable, View } from "react-native";
import { ActivityIndicator, Icon } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "../Button";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";
import RequestCard from "./RequestCard";

const STRIP_SIZE = 6;

/**
 * "Kérések neked": the strip at the very top of the community screen. The server puts the
 * requests that fit the user's bizniszek first and keeps them to the user's surroundings.
 * "Mind" opens the full list; with nothing to show it invites the user to ask for something.
 */
export const RequestsForYou = () => {
  const theme = useAppTheme();
  const dispatch = useDispatch();
  const uid = useSelector((state: RootState) => state.user.uid);
  const { data, loading, error, fetched, load, remove } = useRequests(STRIP_SIZE);

  // Reload on every focus: a request made or solved on the other screens must show up here
  // when the user comes back.
  useFocusEffect(
    useCallback(() => {
      if (uid) load("for_me");
    }, [uid, load]),
  );

  if (!uid) return null;

  const empty = fetched && !loading && !error && data.length === 0;

  return (
    <View testID="requests-for-you">
      <View
        style={{
          paddingHorizontal: Spacing.lg,
          paddingVertical: Spacing.sm,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: Spacing.xs }}>
          <ThemedText variant="labelLarge" type="bold" style={{ color: theme.colors.secondary }}>
            Kérések neked
          </ThemedText>
          <Icon size={18} color={theme.colors.secondary} source="hand-heart-outline" />
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm }}>
          <Pressable
            testID="requests-new"
            onPress={() => router.push("/kerelmek/new")}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Új kérés"
          >
            <Icon size={22} color={theme.colors.primary} source="plus-circle-outline" />
          </Pressable>
          <Pressable
            testID="requests-all"
            onPress={() => {
              // The strip is not a search: don't open the list behind a leftover query.
              dispatch(storeRequestSearchText(""));
              router.push("/kerelmek");
            }}
            style={{ flexDirection: "row", alignItems: "center", gap: Spacing.xs }}
          >
            <ThemedText variant="labelMedium" type="bold" style={{ color: theme.colors.primary }}>
              Mind
            </ThemedText>
            <Icon size={18} color={theme.colors.primary} source="chevron-right" />
          </Pressable>
        </View>
      </View>

      {!!error && (
        <ThemedView style={{ margin: 6, alignItems: "center", padding: Spacing.sm }} type="error">
          <ThemedText type="error">{error}</ThemedText>
        </ThemedView>
      )}

      {empty ? (
        <View style={{ alignItems: "center", gap: Spacing.sm, paddingVertical: Spacing.md }}>
          <ThemedText style={{ textAlign: "center" }}>
            Nincs kérés a környékeden.
          </ThemedText>
          <Button mode="contained-tonal" onPress={() => router.push("/kerelmek/new")}>
            Kérj te valamit
          </Button>
        </View>
      ) : (
        <FlatList
          horizontal
          data={data}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <RequestCard
              data={item}
              compact
              onDeleted={remove}
            />
          )}
          contentContainerStyle={{
            gap: Spacing.sm,
            paddingHorizontal: Spacing.md,
            paddingVertical: Spacing.sm,
          }}
          showsHorizontalScrollIndicator={false}
          ListFooterComponent={
            loading && data.length === 0 ? (
              <ActivityIndicator style={{ alignSelf: "center", marginHorizontal: Spacing.lg }} />
            ) : null
          }
        />
      )}
    </View>
  );
};

export default RequestsForYou;
