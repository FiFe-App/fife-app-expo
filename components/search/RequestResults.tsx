import { useAppTheme } from "@/assets/theme";
import { BorderRadius } from "@/constants/borderRadius";
import { Spacing } from "@/constants/spacing";
import { MODE_SWITCH_CLEARANCE } from "@/constants/layout";
import { useRequests } from "@/hooks/useRequests";
import type { RequestScope } from "@/lib/requests/types";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, View } from "react-native";
import { ActivityIndicator, Icon } from "react-native-paper";
import RequestCard from "../requests/RequestCard";
import { ThemedText } from "../ThemedText";
import { Marker } from "../mapView/mapView";
import { ThemedView } from "../ThemedView";
import NewRequestButton from "./NewRequestButton";
import ResultsMap from "./ResultsMap";
import ViewSwitch from "./ViewSwitch";

/** The empty-state copy per slice of the kérések: what the user can do about it differs. */
/** The most requests the map asks for at once. */
const MAP_PAGE_SIZE = 100;

/** A pin of the map: a heart in a circle, bigger and ringed when picked. */
const RequestPin = ({ selected, solved }: { selected: boolean; solved: boolean }) => {
  const theme = useAppTheme();
  return (
    <View
      style={{
        width: 36,
        height: 36,
        borderRadius: BorderRadius.full,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: selected ? 4 : 2,
        borderColor: selected ? theme.colors.onPrimary : theme.colors.background,
        backgroundColor: solved ? theme.colors.nature : theme.colors.primary,
        transform: [{ scale: selected ? 1.25 : 1 }],
      }}
    >
      <Icon source="hand-heart" size={20} color={theme.colors.onPrimary} />
    </View>
  );
};

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
  view: "list" | "map";
}

/**
 * The kérések of the search screen: the slice the filter picked, narrowed by the query. The one
 * "Új kérés" button is above the list, whatever it holds. In the map view the requests with a
 * place are pins and the one picked is a card at the bottom of the map, as with the bizniszek;
 * there is no list.
 */
export const RequestResults = ({ q, scope, typed, reloadKey, view }: RequestResultsProps) => {
  const theme = useAppTheme();
  // Every request on the map is a pin, so it asks for more of them than a list page holds.
  const requests = useRequests(view === "map" ? MAP_PAGE_SIZE : 10);
  const { load, remove, patch } = requests;
  // "Search around here" on the map: the place the kérések are looked up around, in place of the
  // user's own. Back on the list the user's own place counts again.
  const [center, setCenter] = useState<{ lat: number; long: number } | undefined>(undefined);
  const activeCenter = view === "map" ? center : undefined;

  useEffect(() => {
    load(scope, q, activeCenter);
  }, [scope, q, reloadKey, load, activeCenter]);

  // A request made, solved or deleted elsewhere must show up when the user comes back; the
  // first focus is covered by the effect above.
  const paramsRef = useRef({ scope, q, center: activeCenter });
  useEffect(() => {
    paramsRef.current = { scope, q, center: activeCenter };
  }, [scope, q, activeCenter]);
  const focusedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!focusedOnce.current) {
        focusedOnce.current = true;
        return;
      }
      load(paramsRef.current.scope, paramsRef.current.q, paramsRef.current.center);
    }, [load]),
  );

  const empty = requests.fetched && !requests.loading && !requests.error && requests.data.length === 0;
  const emptyText = q.trim()
    ? { title: "Nincs találat.", hint: "Próbálj más szót, vagy válts a Mind szűrőre." }
    : EMPTY[scope];

  // The pins are the requests with a place ("Bárhol" has none); the picked one is the card at
  // the bottom of the map.
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const pinned = useMemo(
    () => requests.data.filter((r) => r.lat != null && r.long != null),
    [requests.data],
  );
  const selected = requests.data.find((r) => r.id === selectedId) ?? null;

  const list = (
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
      ListHeaderComponent={<NewRequestButton text={typed} testID="search-new-request" />}
      renderItem={({ item }) => (
        <RequestCard
          data={item}
          onDeleted={remove}
          onBlocked={() => load(scope, q, activeCenter)}
          onSolved={(id) =>
            // An archived request leaves every slice but "mine" and "solved".
            scope === "mine" ? patch(id, { status: "solved" }) : remove(id)
          }
        />
      )}
      ListFooterComponent={
        requests.loading ? <ActivityIndicator style={{ marginVertical: Spacing.lg }} /> : null
      }
      ListEmptyComponent={
        requests.error ? (
          <ThemedView type="error" testID="requests-error" style={{ alignItems: "center", padding: Spacing.md }}>
            <ThemedText type="error" style={{ textAlign: "center" }}>
              {requests.error}
            </ThemedText>
          </ThemedView>
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

  if (view !== "map") return list;

  return (
    <View style={{ flex: 1 }}>
      <ResultsMap
        onBackgroundPress={() => setSelectedId(null)}
        viewSwitch={<ViewSwitch inMap />}
        card={
          selected ? (
            <RequestCard
              data={selected}
              onDeleted={(id) => {
                setSelectedId(null);
                remove(id);
              }}
              onBlocked={() => load(scope, q, activeCenter)}
              onSolved={(id) => (scope === "mine" ? patch(id, { status: "solved" }) : remove(id))}
            />
          ) : undefined
        }
        onSearchHere={({ latitude, longitude }) => {
          setSelectedId(null);
          setCenter({ lat: latitude, long: longitude });
        }}
        searchHereLoading={requests.loading}
      >
        {pinned.map((request) => (
          <Marker
            key={request.id}
            coordinate={{ latitude: request.lat as number, longitude: request.long as number }}
            anchor={{ x: 0.5, y: 0.5 }}
            zIndex={request.id === selectedId ? 10 : 1}
            onPress={() => setSelectedId(request.id)}
          >
            <RequestPin selected={request.id === selectedId} solved={request.status === "solved"} />
          </Marker>
        ))}
      </ResultsMap>
    </View>
  );
};

export default RequestResults;
