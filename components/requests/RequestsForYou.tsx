import { useAppTheme } from "@/assets/theme";
import { Spacing } from "@/constants/spacing";
import { useRequests } from "@/hooks/useRequests";
import { REQUESTS_HREF } from "@/lib/requests/navigation";
import {
  openRequestComposer,
  storeRequestScope,
  storeRequestSearchText,
} from "@/redux/reducers/requestsReducer";
import { RootState } from "@/redux/store";
import { router, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { Pressable, View } from "react-native";
import { ActivityIndicator, Icon } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "../Button";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";
import RequestCard from "./RequestCard";

const STRIP_SIZE = 6;

/**
 * "Kérések neked": the section under the FiFe Radar on the community screen. The server puts the
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

  const openAll = () => {
    // The list is the Kérések tab of the search screen. This section is the "for you" slice
    // and not a search: don't open it behind a leftover query or another filter.
    dispatch(storeRequestSearchText(""));
    dispatch(storeRequestScope("for_me"));
    router.push(REQUESTS_HREF);
  };

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
            testID="requests-all"
            onPress={openAll}
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
          <Button mode="contained-tonal" onPress={() => dispatch(openRequestComposer())}>
            Kérj te valamit
          </Button>
        </View>
      ) : (
        <View style={{ gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm }}>
          {data.map((item) => (
            <RequestCard
              key={item.id}
              data={item}
              onDeleted={remove}
              onBlocked={() => load("for_me")}
              onSolved={remove}
            />
          ))}
          {loading && data.length === 0 && <ActivityIndicator style={{ marginVertical: Spacing.lg }} />}
          {data.length >= STRIP_SIZE && (
            <Button mode="contained-tonal" onPress={openAll}>
              Összes kérés
            </Button>
          )}
        </View>
      )}
    </View>
  );
};

export default RequestsForYou;
