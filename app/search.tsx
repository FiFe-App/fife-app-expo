import BuzinessSearchInput from "@/components/BuzinessSearchInput";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Spacing } from "@/constants/spacing";
import { useAppTheme } from "@/assets/theme";
import { useBuzinessSearch } from "@/hooks/useBuzinessSearch";
import { useSearchSuggestions } from "@/hooks/useSearchSuggestions";
import BuzinessResults from "@/components/search/BuzinessResults";
import FifeResults from "@/components/search/FifeResults";
import RequestResults from "@/components/search/RequestResults";
import SearchFilterModal from "@/components/search/SearchFilterModal";
import Measure from "@/components/tutorial/Measure";
import { Button } from "@/components/Button";
import { MyAppbar } from "@/components/MyAppBar";
import { searchHref } from "@/lib/search/href";
import { runSearch } from "@/lib/search/runSearch";
import { searchTitle } from "@/lib/search/title";
import { RequestScope } from "@/lib/requests/types";
import { storeSearchText } from "@/redux/reducers/searchReducer";
import { removeFromPreviousSearches } from "@/redux/reducers/userReducer";
import { RootState } from "@/redux/store";
import { SearchMode } from "@/redux/store.type";
import { router, useFocusEffect, useLocalSearchParams, useNavigation } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { Chip, Icon } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { MODE_SWITCH_CLEARANCE } from "@/constants/layout";
import { BorderRadius } from "@/constants/borderRadius";

type ListItem =
  | { kind: "section"; label: string }
  | { kind: "previous"; query: string }
  | { kind: "suggestion"; query: string };

const MODES: { key: SearchMode; label: string; icon: string }[] = [
  { key: "biznisz", label: "Bizniszek", icon: "briefcase-outline" },
  { key: "kerelem", label: "Kérések", icon: "hand-heart-outline" },
  { key: "fife", label: "Fifék", icon: "account" },
];

const SCOPES: RequestScope[] = ["all", "for_me", "mine", "solved"];
const isMode = (value: string | undefined): value is SearchMode =>
  MODES.some((m) => m.key === value);
const isScope = (value: string | undefined): value is RequestScope =>
  SCOPES.includes(value as RequestScope);

/**
 * The one place every search happens. A search is a route (/search?mode=…&q=…&scope=…): a chip
 * starts the default search of its category (new bizniszek, the FiFe Radar, the kérések for
 * you), a typed query starts a concrete one, and each is its own entry of the history, so
 * Back steps through them — the empty ones too.
 */
export default function SearchScreen() {
  const theme = useAppTheme();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  // `focus` comes from a search box that was tapped (FakeSearchInput): the keyboard opens.
  const params = useLocalSearchParams<{ mode?: string; q?: string; scope?: string; focus?: string }>();
  const mode: SearchMode = isMode(params.mode) ? params.mode : "biznisz";
  const q = typeof params.q === "string" ? params.q : "";
  const scope: RequestScope = isScope(params.scope) ? params.scope : "for_me";
  const autoFocus = params.focus === "1";

  const buzinessCircle = useSelector((state: RootState) => state.buziness.searchParams?.searchCircle);
  const buzinessIngyen = useSelector((state: RootState) => state.buziness.searchParams?.ingyen) ?? false;
  const fifeCircle = useSelector((state: RootState) => state.users.userSearchParams?.searchCircle);
  // What is typed in the box right now; the "Új kérés" buttons carry it into the modal.
  const [typed, setTyped] = useState(q);
  // The previous searches are for the moment the user taps into the box, and no longer.
  const [inputFocused, setInputFocused] = useState(autoFocus);
  // Bumped when the chip of the search already on screen is tapped: load it again.
  const [reloadKey, setReloadKey] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);

  // Each mode keeps its own history: a name you looked up is not a biznisz query.
  const previousBuzinessSearches = useSelector((state: RootState) => state.user.previousSearches);
  const previousProfileSearches = useSelector(
    (state: RootState) => state.user.previousProfileSearches,
  );
  // The kérések keep no history.
  const previousSearches =
    mode === "fife" ? previousProfileSearches : mode === "kerelem" ? [] : previousBuzinessSearches;
  const suggestions = useSearchSuggestions(typed, inputFocused && mode === "biznisz");

  // The bizniszek live in redux (the list and the map share them), so a screen that comes back
  // into focus — Back from a later search — has to put its own search there again.
  const { canLoadMore, search, loadNext, error } = useBuzinessSearch();
  // The one search text of the store follows the search on screen, whichever kind it is.
  useFocusEffect(
    useCallback(() => {
      dispatch(storeSearchText(q));
    }, [q, dispatch]),
  );
  useFocusEffect(
    useCallback(() => {
      if (mode !== "biznisz") return;
      search(q);
      // reloadKey is not read: bumping it is how a tap on the active chip asks for a reload.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, q, reloadKey, dispatch, search]),
  );

  const handleSearch = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      // The empty search is the category's default one, and is a history entry like any other.
      if (!q) setReloadKey((k) => k + 1);
      else router.push(searchHref(mode, { scope }));
      return;
    }
    if (mode === "kerelem") {
      // The default slice is "for you", which is a poor place to look something up in.
      router.push(searchHref(mode, { q: trimmed, scope: scope === "for_me" ? "all" : scope }));
      return;
    }
    runSearch(dispatch, trimmed, mode);
  }, [dispatch, mode, q, scope]);

  useEffect(() => {
    navigation.setOptions({
      header: () => (
        <MyAppbar
          center={
            <BuzinessSearchInput
              mode={mode}
              initialText={q}
              onSearch={handleSearch}
              autoFocus={autoFocus}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              onChangeText={setTyped}
              showSuggestionsDropdown={false}
            />
          }
          style={{ elevation: 0, shadowOpacity: 0, borderBottomWidth: 0 }}
        />
      ),
    });
  }, [navigation, handleSearch, mode, q, autoFocus]);

  const openMode = (next: SearchMode) => {
    const nextScope = next === "kerelem" ? "for_me" : undefined;
    // The same default search as the one on screen: load it again instead of stacking a twin.
    if (next === mode && !q && (next !== "kerelem" || scope === "for_me")) {
      setReloadKey((k) => k + 1);
      return;
    }
    router.push(searchHref(next, { scope: nextScope }));
  };

  const listData = useMemo<ListItem[]>(() => {
    const prev = (previousSearches ?? []).filter((p) =>
      !typed || p.toLowerCase().includes(typed.toLowerCase())
    );
    const suggestionTexts = new Set(prev.map((p) => p.toLowerCase()));
    const filtered = suggestions.filter((s) => !suggestionTexts.has(s.query_text.toLowerCase()));

    const items: ListItem[] = [];
    if (prev.length > 0) {
      items.push({ kind: "section", label: "Korábbi kereséseid" });
      prev.forEach((p) => items.push({ kind: "previous", query: p }));
    }
    if (mode === "biznisz" && filtered.length > 0) {
      items.push({ kind: "section", label: "Gyakori keresések" });
      filtered.forEach((s) => items.push({ kind: "suggestion", query: s.query_text }));
    }
    return items;
  }, [previousSearches, suggestions, typed, mode]);
  const showHistory = inputFocused && listData.length > 0;

  const filterActive =
    mode === "kerelem"
      ? scope !== "for_me"
      : mode === "biznisz"
        ? !!buzinessCircle || buzinessIngyen
        : !!fifeCircle;
  const title = searchTitle({
    mode,
    q,
    scope,
    ingyen: buzinessIngyen,
    hasCircle: mode === "fife" ? !!fifeCircle : !!buzinessCircle,
  });

  return (
    <ThemedView style={{ flex: 1 }} type="default">
      <ThemedView
        type="card"
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: Spacing.sm,
          paddingHorizontal: Spacing.lg,
          paddingTop: Spacing.sm,
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
              onPress={() => openMode(m.key)}
              accessibilityState={{ selected }}
              selectedColor={selected ? theme.colors.onPrimary : theme.colors.onSurfaceVariant}
              style={{
                borderRadius: BorderRadius.full,
                backgroundColor: selected ? theme.colors.primary : "transparent",
                borderColor: selected ? theme.colors.primary : theme.colors.outlineVariant,
              }}
              textStyle={{
                color: selected ? theme.colors.onPrimary : theme.colors.onSurfaceVariant,
                fontFamily: selected ? "RedHatText-Bold" : "RedHatText",
              }}
            >
              {m.label}
            </Chip>
          );
        })}
      </ThemedView>
      <ThemedView
        type="card"
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: Spacing.sm,
          paddingLeft: Spacing.lg,
          paddingRight: Spacing.sm,
          paddingVertical: Spacing.xs,
        }}
      >
        <ThemedText
          testID="search-title"
          variant="labelLarge"
          type="bold"
          numberOfLines={2}
          style={{ flex: 1, color: theme.colors.secondary }}
        >
          {title}
        </ThemedText>
        {/* Always there: what it opens follows the chip that is selected. */}
        <Measure name="filter">
          <View>
            <Button
              testID="search-filter"
              icon={filterActive ? "filter-check" : "filter"}
              mode="text"
              onPress={() => setFilterOpen(true)}
            >
              Finomítás
            </Button>
          </View>
        </Measure>
      </ThemedView>

      {showHistory ? (
        <FlatList
          data={listData}
          keyExtractor={(item, i) => item.kind + (item.kind === "section" ? item.label : item.query) + i}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: MODE_SWITCH_CLEARANCE }}
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
      ) : mode === "biznisz" ? (
        <BuzinessResults
          canLoadMore={canLoadMore}
          loadNext={loadNext}
          error={error}
          reload={() => search(q)}
          typed={typed}
        />
      ) : mode === "fife" ? (
        <FifeResults q={q} reloadKey={reloadKey} />
      ) : (
        <RequestResults q={q} scope={scope} typed={typed} reloadKey={reloadKey} />
      )}

      <SearchFilterModal
        mode={mode}
        scope={scope}
        onScopeChange={(next) => router.setParams({ scope: next })}
        onBuzinessApplied={(searchCircle, ingyen) => search(q, { searchCircle, ingyen })}
        visible={filterOpen}
        onDismiss={() => setFilterOpen(false)}
      />
    </ThemedView>
  );
}
