import { useAppTheme } from "@/assets/theme";
import { Spacing } from "@/constants/spacing";
import { MODE_SWITCH_CLEARANCE } from "@/constants/layout";
import { useRequests } from "@/hooks/useRequests";
import type { RequestScope } from "@/lib/requests/types";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { FlatList, View } from "react-native";
import { ActivityIndicator, Icon } from "react-native-paper";
import RequestCard from "../requests/RequestCard";
import { ThemedText } from "../ThemedText";
import NewRequestButton from "./NewRequestButton";

/** The empty-state copy per slice of the kérések: what the user can do about it differs. */
const EMPTY: Record<RequestScope, { title: string; hint: string }> = {
  all: { title: "Még nincs kérés.", hint: "Légy te az első, aki kér valamit a közösségtől!" },
  for_me: {
    title: "Most nincs a környékeden, ami neked való kérés.",
    hint: "Nézd meg a Finomítás › Mind szűrőt, vagy kérj te valamit.",
  },
  mine: { title: "Még nem kértél semmit.", hint: "Ha elakadtál valamivel, kérdezd meg a közösséget!" },
  solved: { title: "Még nincs megoldott kérés.", hint: "Itt jelennek meg az archivált kérések." },
};

interface RequestResultsProps {
  q: string;
  scope: RequestScope;
  /** What is in the search box right now, carried into the "Új kérés" buttons. */
  typed: string;
  reloadKey: number;
}

/**
 * The kérések of the search screen: the slice the filter picked, narrowed by the query. The
 * "Új kérés" button is above and under the list, whatever it holds.
 */
export const RequestResults = ({ q, scope, typed, reloadKey }: RequestResultsProps) => {
  const theme = useAppTheme();
  const requests = useRequests(10);
  const { load, remove, patch } = requests;

  useEffect(() => {
    load(scope, q);
  }, [scope, q, reloadKey, load]);

  // A request made, solved or deleted elsewhere must show up when the user comes back; the
  // first focus is covered by the effect above.
  const paramsRef = useRef({ scope, q });
  useEffect(() => {
    paramsRef.current = { scope, q };
  }, [scope, q]);
  const focusedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!focusedOnce.current) {
        focusedOnce.current = true;
        return;
      }
      load(paramsRef.current.scope, paramsRef.current.q);
    }, [load]),
  );

  const empty = requests.fetched && !requests.loading && !requests.error && requests.data.length === 0;
  const emptyText = q.trim()
    ? { title: "Nincs találat.", hint: "Próbálj más szót, vagy válts a Mind szűrőre." }
    : EMPTY[scope];

  return (
    <FlatList
      testID="search-requests"
      data={requests.data}
      keyExtractor={(item) => String(item.id)}
      keyboardShouldPersistTaps="handled"
      onEndReachedThreshold={0.6}
      onEndReached={requests.loadMore}
      contentContainerStyle={{
        padding: Spacing.md,
        gap: Spacing.sm,
        paddingBottom: MODE_SWITCH_CLEARANCE + Spacing.md,
        flexGrow: 1,
      }}
      ListHeaderComponent={<NewRequestButton text={typed} testID="search-new-request-top" />}
      renderItem={({ item }) => (
        <RequestCard
          data={item}
          onDeleted={remove}
          onBlocked={() => load(scope, q)}
          onSolved={(id) =>
            // An archived request leaves every slice but "mine" and "solved".
            scope === "mine" ? patch(id, { status: "solved" }) : remove(id)
          }
        />
      )}
      ListFooterComponent={
        <View style={{ gap: Spacing.sm }}>
          {requests.loading && <ActivityIndicator style={{ marginVertical: Spacing.lg }} />}
          <NewRequestButton text={typed} testID="search-new-request-bottom" />
        </View>
      }
      ListEmptyComponent={
        requests.error ? (
          <ThemedText type="error" style={{ textAlign: "center", padding: Spacing.lg }}>
            {requests.error}
          </ThemedText>
        ) : empty ? (
          <View style={{ alignItems: "center", gap: Spacing.sm, paddingVertical: Spacing.xl }}>
            <Icon source="hand-heart-outline" size={40} color={theme.colors.onSurfaceVariant} />
            <ThemedText type="bold" style={{ textAlign: "center" }}>{emptyText.title}</ThemedText>
            <ThemedText style={{ textAlign: "center", color: theme.colors.onSurfaceVariant }}>
              {emptyText.hint}
            </ThemedText>
          </View>
        ) : null
      }
    />
  );
};

export default RequestResults;
