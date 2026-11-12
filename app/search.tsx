import BuzinessSearchInput from "@/components/BuzinessSearchInput";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Spacing } from "@/constants/spacing";
import { useAppTheme } from "@/assets/theme";
import { useSearchSuggestions } from "@/hooks/useSearchSuggestions";
import { useNearbyBuzinesses } from "@/hooks/useNearbyBuzinesses";
import { useRequests } from "@/hooks/useRequests";
import BuzinessItem from "@/components/buziness/BuzinessItem";
import RequestCard from "@/components/requests/RequestCard";
import SearchFilterModal from "@/components/search/SearchFilterModal";
import { Button } from "@/components/Button";
import { REQUEST_SCOPES } from "@/lib/requests/types";
import { openRequestComposer, storeRequestSearchText } from "@/redux/reducers/requestsReducer";
import { removeFromPreviousSearches } from "@/redux/reducers/userReducer";
import { RootState } from "@/redux/store";
import { SearchMode } from "@/redux/store.type";
import { useFocusEffect, useLocalSearchParams, useNavigation } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { ActivityIndicator, Chip, Icon } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { MyAppbar } from "@/components/MyAppBar";
import { runSearch } from "@/lib/search/runSearch";
import { MODE_SWITCH_CLEARANCE } from "@/constants/layout";
import { BorderRadius } from "@/constants/borderRadius";

type ListItem =
  | { kind: "section"; label: string }
  | { kind: "previous"; query: string }
  | { kind: "suggestion"; query: string };

const MODES: { key: SearchMode; label: string; icon: string }[] = [
  { key: "biznisz", label: "Bizniszek", icon: "briefcase-outline" },
  { key: "fife", label: "Fifék", icon: "account" },
  { key: "kerelem", label: "Kérések", icon: "hand-heart-outline" },
];

const isMode = (value: string | undefined): value is SearchMode =>
  MODES.some((m) => m.key === value);

/** The empty-state copy per slice of the kérések: what the user can do about it differs. */
const EMPTY_REQUESTS: Record<string, { title: string; hint: string }> = {
  all: { title: "Még nincs kérés.", hint: "Légy te az első, aki kér valamit a közösségtől!" },
  for_me: {
    title: "Most nincs a környékeden, ami neked való kérés.",
    hint: "Nézd meg a Finomítás › Mind szűrőt, vagy kérj te valamit.",
  },
  mine: { title: "Még nem kértél semmit.", hint: "Ha elakadtál valamivel, kérdezd meg a közösséget!" },
  solved: { title: "Még nincs megoldott kérés.", hint: "Itt jelennek meg az archivált kérések." },
};

export default function SearchScreen() {
  const theme = useAppTheme();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  // `mode` is set by a search box (FakeSearchInput always passes it); the menu tab passes
  // nothing. `browse` asks for the quiet view (no keyboard) even with a mode, e.g. from the
  // "Összes kérés" button of the community screen.
  const params = useLocalSearchParams<{ mode?: string; browse?: string }>();
  const [mode, setMode] = useState<SearchMode>(isMode(params.mode) ? params.mode : "biznisz");
  const requestMode = mode === "kerelem";

  const buzinessText = useSelector((state: RootState) => state.buziness.searchParams?.text ?? "");
  const fifeText = useSelector((state: RootState) => state.users.userSearchParams?.text ?? "");
  const requestText = useSelector((state: RootState) => state.requests.searchText);
  const requestScope = useSelector((state: RootState) => state.requests.scope);
  const buzinessCircle = useSelector((state: RootState) => state.buziness.searchParams?.searchCircle);
  const buzinessIngyen = useSelector((state: RootState) => state.buziness.searchParams?.ingyen) ?? false;
  const searchText = mode === "fife" ? fifeText : mode === "kerelem" ? requestText : buzinessText;
  // The box is re-seeded from the other mode's slice on a flip; what counts as typed follows.
  const textOf = (m: SearchMode) => (m === "fife" ? fifeText : m === "kerelem" ? requestText : buzinessText);
  // What is typed in the box right now (the kérések search itself only runs on submit).
  const [typed, setTyped] = useState(requestText);
  // Each mode keeps its own history: a name you looked up is not a biznisz query.
  const previousBuzinessSearches = useSelector((state: RootState) => state.user.previousSearches);
  const previousProfileSearches = useSelector(
    (state: RootState) => state.user.previousProfileSearches,
  );
  const previousSearches = mode === "fife" ? previousProfileSearches : previousBuzinessSearches;

  const suggestions = useSearchSuggestions(searchText, mode === "biznisz");

  // Opened from the menu the screen is for browsing: no keyboard, no history, just what is
  // new. Opened from a search box, or once the user taps into the box, it is for searching.
  const [engaged, setEngaged] = useState(isMode(params.mode) && params.browse !== "1");
  const browsing = !engaged && !requestMode;
  const browseBizniszek = useNearbyBuzinesses(10, {
    searchCircle: buzinessCircle,
    ingyen: buzinessIngyen,
  });
  const requests = useRequests(10);
  const { fetch: fetchNewBizniszek } = browseBizniszek;
  const { load: loadRequests } = requests;
  useEffect(() => {
    if (browsing && mode === "biznisz") fetchNewBizniszek();
  }, [browsing, mode, fetchNewBizniszek]);

  // The kérések are listed right here: the filter and the submitted text pick what is shown.
  // A request made, solved or deleted elsewhere must show up when the user comes back, so the
  // list reloads on focus too (the first focus is covered by the effect).
  const requestParamsRef = useRef({ scope: requestScope, query: requestText });
  useEffect(() => {
    requestParamsRef.current = { scope: requestScope, query: requestText };
  }, [requestScope, requestText]);
  useEffect(() => {
    if (requestMode) loadRequests(requestScope, requestText);
  }, [requestMode, requestScope, requestText, loadRequests]);
  const focusedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!focusedOnce.current) {
        focusedOnce.current = true;
        return;
      }
      if (requestMode) loadRequests(requestParamsRef.current.scope, requestParamsRef.current.query);
    }, [requestMode, loadRequests]),
  );

  const handleSearch = useCallback((query: string) => {
    if (mode === "kerelem") {
      // The results are on this very screen: just set what they filter by.
      dispatch(storeRequestSearchText(query.trim()));
      return;
    }
    runSearch(dispatch, query, mode, "replace");
  }, [dispatch, mode]);

  useEffect(() => {
    navigation.setOptions({
      header: () => (
        <MyAppbar
          // key re-seeds the input's local text from the other slice on a flip.
          center={<BuzinessSearchInput key={mode} mode={mode} onSearch={handleSearch} autoFocus={engaged} onFocus={() => setEngaged(true)} onChangeText={setTyped} showSuggestionsDropdown={false} />}
          style={{ elevation: 0, shadowOpacity: 0, borderBottomWidth: 0 }}
        />
      ),
    });
  }, [navigation, handleSearch, mode, engaged]);

  const listData = useMemo<ListItem[]>(() => {
    const prev = (previousSearches ?? []).filter((q) =>
      !searchText || q.toLowerCase().includes(searchText.toLowerCase())
    );
    const suggestionTexts = new Set(prev.map((q) => q.toLowerCase()));
    const filtered = suggestions.filter((s) => !suggestionTexts.has(s.query_text.toLowerCase()));

    const items: ListItem[] = [];
    if (prev.length > 0) {
      items.push({ kind: "section", label: "Korábbi kereséseid" });
      prev.forEach((q) => items.push({ kind: "previous", query: q }));
    }
    if (mode === "biznisz" && filtered.length > 0) {
      items.push({ kind: "section", label: "Gyakori keresések" });
      filtered.forEach((s) => items.push({ kind: "suggestion", query: s.query_text }));
    }
    return items;
  }, [previousSearches, suggestions, searchText, mode]);

  // The "Finomítás" modal: what it refines depends on what is searched.
  const [filterOpen, setFilterOpen] = useState(false);
  const filterActive =
    mode === "kerelem"
      ? requestScope !== "all"
      : mode === "biznisz"
        ? !!buzinessCircle || buzinessIngyen
        : false;

  const requestsEmpty = requests.fetched && !requests.loading && !requests.error && requests.data.length === 0;
  const requestsTitle = requestText.trim()
    ? `Találatok: ${requestText.trim()}`
    : requestScope === "all"
      ? "Új kérések"
      : `Kérések: ${REQUEST_SCOPES.find((s) => s.key === requestScope)?.label ?? ""}`;
  const emptyText = requestText.trim()
    ? { title: "Nincs találat.", hint: "Próbálj más szót, vagy válts a Mind szűrőre." }
    : EMPTY_REQUESTS[requestScope];

  return (
    <ThemedView style={{ flex: 1 }} type="default">
      <ThemedView
        type="card"
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
          gap: Spacing.sm,
          paddingHorizontal: Spacing.lg,
          paddingVertical: Spacing.sm,
        }}
      >
        {MODES.map((m) => {
          const selected = mode === m.key;
          return (
            <Chip
              key={m.key}
              testID={`search-mode-${m.key}`}
              icon={m.icon}
              selected={selected}
              showSelectedCheck={false}
              mode={selected ? "flat" : "outlined"}
              onPress={() => {
                setMode(m.key);
                setTyped(textOf(m.key));
              }}
              style={{
                borderRadius: BorderRadius.full,
                backgroundColor: selected ? theme.colors.secondaryContainer : "transparent",
                borderColor: theme.colors.outlineVariant,
              }}
              textStyle={{
                color: selected ? theme.colors.onSecondaryContainer : theme.colors.onSurfaceVariant,
              }}
            >
              {m.label}
            </Chip>
          );
        })}
        {/* Always there: what it opens follows the chip that is selected. */}
        <View style={{ marginLeft: "auto" }}>
          <Button
            testID="search-filter"
            icon={filterActive ? "filter-check" : "filter"}
            mode="text"
            onPress={() => setFilterOpen(true)}
          >
            Finomítás
          </Button>
        </View>
      </ThemedView>

      {requestMode && (
        <>
          {!!typed.trim() && (
            // Nobody asked for this yet? The typed text becomes the title of a new request.
            <Pressable
              testID="search-new-request"
              onPress={() => dispatch(openRequestComposer(typed))}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: Spacing.md,
                paddingHorizontal: Spacing.lg,
                paddingVertical: Spacing.md,
                backgroundColor: pressed ? theme.colors.surfaceVariant : "transparent",
              })}
            >
              <Icon source="plus-circle-outline" size={22} color={theme.colors.primary} />
              <ThemedText type="bold" numberOfLines={1} style={{ flex: 1, color: theme.colors.primary }}>
                Új kérés: „{typed.trim()}”
              </ThemedText>
            </Pressable>
          )}
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
            ListHeaderComponent={
              <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.xs }}>
                <ThemedText
                  variant="labelLarge"
                  type="bold"
                  numberOfLines={1}
                  style={{ flexShrink: 1, color: theme.colors.secondary }}
                >
                  {requestsTitle}
                </ThemedText>
                {!!requestText.trim() && (
                  <Chip
                    testID="requests-clear-search"
                    icon="close"
                    compact
                    onPress={() => {
                      dispatch(storeRequestSearchText(""));
                      setTyped("");
                    }}
                  >
                    Törlés
                  </Chip>
                )}
              </View>
            }
            renderItem={({ item }) => (
              <RequestCard
                data={item}
                onDeleted={requests.remove}
                onBlocked={() => loadRequests(requestScope, requestText)}
                onSolved={(id) =>
                  // An archived request leaves every slice but "mine" and "solved".
                  requestScope === "mine"
                    ? requests.patch(id, { status: "solved" })
                    : requests.remove(id)
                }
              />
            )}
            ListFooterComponent={
              requests.loading ? <ActivityIndicator style={{ marginVertical: Spacing.lg }} /> : null
            }
            ListEmptyComponent={
              requests.error ? (
                <ThemedText type="error" style={{ textAlign: "center", padding: Spacing.lg }}>
                  {requests.error}
                </ThemedText>
              ) : requestsEmpty ? (
                <View style={{ alignItems: "center", gap: Spacing.sm, paddingVertical: Spacing.xxxl }}>
                  <Icon source="hand-heart-outline" size={40} color={theme.colors.onSurfaceVariant} />
                  <ThemedText type="bold" style={{ textAlign: "center" }}>{emptyText.title}</ThemedText>
                  <ThemedText style={{ textAlign: "center", color: theme.colors.onSurfaceVariant }}>
                    {emptyText.hint}
                  </ThemedText>
                  <Button
                    testID="requests-empty-new"
                    mode="contained-tonal"
                    onPress={() => dispatch(openRequestComposer(requestText.trim() || undefined))}
                  >
                    {requestText.trim() ? "Új kérés ezzel a szöveggel" : "Új kérés"}
                  </Button>
                </View>
              ) : null
            }
          />
        </>
      )}

      {browsing && mode === "biznisz" && (
        <FlatList
          testID="search-browse-bizniszek"
          data={browseBizniszek.data}
          keyExtractor={(item) => String(item.id)}
          onEndReachedThreshold={0.6}
          onEndReached={browseBizniszek.fetchNextPage}
          contentContainerStyle={{
            padding: Spacing.md,
            gap: Spacing.sm,
            paddingBottom: MODE_SWITCH_CLEARANCE + Spacing.md,
          }}
          ListHeaderComponent={
            <ThemedText variant="labelLarge" type="bold" style={{ color: theme.colors.secondary }}>
              Új bizniszek
            </ThemedText>
          }
          renderItem={({ item }) => <BuzinessItem data={item} />}
          ListFooterComponent={
            browseBizniszek.loading ? <ActivityIndicator style={{ marginVertical: Spacing.lg }} /> : null
          }
          ListEmptyComponent={
            browseBizniszek.error ? (
              <ThemedText type="error" style={{ textAlign: "center" }}>{browseBizniszek.error}</ThemedText>
            ) : browseBizniszek.fetched && !browseBizniszek.loading ? (
              <ThemedText style={{ textAlign: "center", padding: Spacing.lg }}>
                Még nincs biznisz.
              </ThemedText>
            ) : null
          }
        />
      )}
      {browsing && mode === "fife" && (
        <View style={{ padding: Spacing.lg }}>
          <ThemedText
            variant="labelMedium"
            style={{ color: theme.colors.onSurfaceVariant, textAlign: "center" }}
          >
            Írd be egy fife nevét vagy @felhasználónevét.
          </ThemedText>
        </View>
      )}

      {!browsing && !requestMode && (
        <FlatList
          data={listData}
          keyExtractor={(item, i) => item.kind + (item.kind === "section" ? item.label : item.query) + i}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: MODE_SWITCH_CLEARANCE }}
          ListEmptyComponent={
            mode === "fife" ? (
              <View style={{ padding: Spacing.lg }}>
                <ThemedText
                  variant="labelMedium"
                  style={{ color: theme.colors.onSurfaceVariant, textAlign: "center" }}
                >
                  Írd be egy fife nevét vagy @felhasználónevét.
                </ThemedText>
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            if (item.kind === "section") {
              return (
                <ThemedText
                  variant="labelMedium"
                  style={{ color: theme.colors.onSurfaceVariant, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm }}
                >
                  {item.label}
                </ThemedText>
              );
            }
            return (
              <Pressable
                onPress={() => handleSearch(item.query)}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: Spacing.md,
                  paddingHorizontal: Spacing.lg,
                  paddingVertical: Spacing.md,
                  backgroundColor: pressed ? theme.colors.surfaceVariant : "transparent",
                })}
              >
                <Icon
                  source={item.kind === "previous" ? "history" : "magnify"}
                  size={20}
                  color={theme.colors.onSurfaceVariant}
                />
                <ThemedText style={{ flex: 1, color: theme.colors.onSurface }} numberOfLines={1}>
                  {item.query}
                </ThemedText>
                {item.kind === "previous" && (
                  <Pressable
                    testID={`remove-previous-${item.query}`}
                    onPress={() => dispatch(removeFromPreviousSearches({ query: item.query, mode }))}
                    hitSlop={8}
                  >
                    <Icon source="close" size={18} color={theme.colors.onSurfaceVariant} />
                  </Pressable>
                )}
              </Pressable>
            );
          }}
        />
      )}

      <SearchFilterModal mode={mode} visible={filterOpen} onDismiss={() => setFilterOpen(false)} />
    </ThemedView>
  );
}
