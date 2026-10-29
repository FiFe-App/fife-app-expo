import { useAppTheme } from "@/assets/theme";
import { Button } from "@/components/Button";
import RequestCard from "@/components/requests/RequestCard";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { BorderRadius } from "@/constants/borderRadius";
import { Spacing } from "@/constants/spacing";
import { useRequests } from "@/hooks/useRequests";
import { REQUEST_SCOPES, RequestScope } from "@/lib/requests/types";
import { storeRequestSearchText } from "@/redux/reducers/requestsReducer";
import { RootState } from "@/redux/store";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, View } from "react-native";
import { ActivityIndicator, Chip, FAB, Icon } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";

/** The empty-state copy per scope: what the user can do about it differs. */
const EMPTY: Record<RequestScope, { title: string; hint: string }> = {
  all: {
    title: "Még nincs kérés.",
    hint: "Légy te az első, aki kér valamit a közösségtől!",
  },
  for_me: {
    title: "Most nincs a környékeden, ami neked való kérés.",
    hint: "Nézd meg a Mind fület, vagy kérj te valamit.",
  },
  mine: {
    title: "Még nem kértél semmit.",
    hint: "Ha elakadtál valamivel, kérdezd meg a közösséget!",
  },
  solved: {
    title: "Még nincs megoldott kérés.",
    hint: "Itt jelennek meg az archivált, megoldott kérések.",
  },
};

export default function RequestsScreen() {
  const theme = useAppTheme();
  const dispatch = useDispatch();
  const uid = useSelector((state: RootState) => state.user.uid);
  const searchText = useSelector((state: RootState) => state.requests.searchText);
  const [scope, setScope] = useState<RequestScope>("all");
  const { data, loading, error, fetched, load, loadMore, remove, patch } = useRequests(10);

  const isSearching = searchText.trim().length > 0;

  // Reload when the filter or the search changes, and again whenever the screen regains
  // focus (a request created or solved elsewhere must show up). The focus callback reads the
  // current filter from a ref, so a filter change does not fire it a second time, and it
  // skips the very first focus, which the effect above already covers.
  const paramsRef = useRef({ scope, searchText });
  const focusedOnce = useRef(false);
  useEffect(() => {
    paramsRef.current = { scope, searchText };
  }, [scope, searchText]);

  useEffect(() => {
    load(scope, searchText);
  }, [scope, searchText, load]);

  useFocusEffect(
    useCallback(() => {
      if (!focusedOnce.current) {
        focusedOnce.current = true;
        return;
      }
      load(paramsRef.current.scope, paramsRef.current.searchText);
    }, [load]),
  );

  if (!uid) return null;

  const empty = fetched && !loading && !error && data.length === 0;
  const text = isSearching
    ? { title: "Nincs találat.", hint: "Próbálj más szót, vagy válts a Mind fülre." }
    : EMPTY[scope];

  return (
    <ThemedView style={{ flex: 1 }} type="default">
      <ThemedView
        type="card"
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: Spacing.sm,
          paddingHorizontal: Spacing.lg,
          paddingVertical: Spacing.sm,
        }}
      >
        {REQUEST_SCOPES.map((s) => {
          const selected = scope === s.key;
          return (
            <Chip
              key={s.key}
              testID={`requests-scope-${s.key}`}
              icon={s.icon}
              selected={selected}
              showSelectedCheck={false}
              mode={selected ? "flat" : "outlined"}
              onPress={() => setScope(s.key)}
              style={{
                borderRadius: BorderRadius.full,
                backgroundColor: selected ? theme.colors.secondaryContainer : "transparent",
                borderColor: theme.colors.outlineVariant,
              }}
              textStyle={{
                color: selected ? theme.colors.onSecondaryContainer : theme.colors.onSurfaceVariant,
              }}
            >
              {s.label}
            </Chip>
          );
        })}
      </ThemedView>

      {isSearching && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: Spacing.xs,
            paddingHorizontal: Spacing.lg,
            paddingTop: Spacing.sm,
          }}
        >
          <ThemedText variant="labelLarge" type="bold" numberOfLines={1} style={{ flexShrink: 1, color: theme.colors.secondary }}>
            Találatok: {searchText}
          </ThemedText>
          <Chip
            testID="requests-clear-search"
            icon="close"
            compact
            onPress={() => dispatch(storeRequestSearchText(""))}
          >
            Törlés
          </Chip>
        </View>
      )}

      {!!error && (
        <ThemedView style={{ margin: Spacing.md, alignItems: "center", padding: Spacing.sm }} type="error">
          <ThemedText type="error">{error}</ThemedText>
        </ThemedView>
      )}

      <FlatList
        testID="requests-list"
        data={data}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <RequestCard
            data={item}
            onDeleted={remove}
            onBlocked={() => load(scope, searchText)}
            onSolved={(id) =>
              // An archived request leaves every feed but "mine" and "solved".
              scope === "mine"
                ? patch(id, { status: "solved" })
                : remove(id)
            }
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        contentContainerStyle={{
          padding: Spacing.md,
          paddingBottom: 96,
          flexGrow: 1,
        }}
        onEndReachedThreshold={0.6}
        onEndReached={loadMore}
        ListFooterComponent={loading ? <ActivityIndicator style={{ marginVertical: Spacing.lg }} /> : null}
        ListEmptyComponent={
          empty ? (
            <View style={{ alignItems: "center", gap: Spacing.sm, paddingVertical: Spacing.xxxl }}>
              <Icon source="hand-heart-outline" size={40} color={theme.colors.onSurfaceVariant} />
              <ThemedText type="bold" style={{ textAlign: "center" }}>{text.title}</ThemedText>
              <ThemedText style={{ textAlign: "center", color: theme.colors.onSurfaceVariant }}>
                {text.hint}
              </ThemedText>
              <Button mode="contained-tonal" onPress={() => router.push("/kerelmek/new")}>
                Új kérés
              </Button>
            </View>
          ) : null
        }
      />

      <FAB
        testID="requests-fab"
        icon="plus"
        label="Új kérés"
        onPress={() => router.push("/kerelmek/new")}
        style={{ position: "absolute", right: Spacing.lg, bottom: Spacing.lg }}
      />
    </ThemedView>
  );
}
