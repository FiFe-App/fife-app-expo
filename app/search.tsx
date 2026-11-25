import BuzinessSearchInput from "@/components/BuzinessSearchInput";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Spacing } from "@/constants/spacing";
import { useAppTheme } from "@/assets/theme";
import { useBuzinessSearch } from "@/hooks/useBuzinessSearch";
import { useFifeResults } from "@/hooks/useFifeResults";
import { useRequestResults } from "@/hooks/useRequestResults";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import { useSearchSuggestions } from "@/hooks/useSearchSuggestions";
import BuzinessItem from "@/components/buziness/BuzinessItem";
import BuzinessResults from "@/components/search/BuzinessResults";
import NewRequestButton from "@/components/search/NewRequestButton";
import { BuzinessPin, FifePin, RequestPin } from "@/components/search/pins";
import RequestCard from "@/components/requests/RequestCard";
import RequestList from "@/components/search/RequestList";
import SearchFilterModal from "@/components/search/SearchFilterModal";
import SearchMap from "@/components/search/SearchMap";
import ViewSwitch from "@/components/search/ViewSwitch";
import UserItem from "@/components/user/UserItem";
import { UsersList } from "@/components/user/UsersList";
import { Marker } from "@/components/mapView/mapView";
import Measure from "@/components/tutorial/Measure";
import { Button } from "@/components/Button";
import { MyAppbar } from "@/components/MyAppBar";
import locationToCoords from "@/lib/functions/locationToCoords";
import { runSearch } from "@/lib/search/runSearch";
import { searchTitle } from "@/lib/search/title";
import { RequestScope } from "@/lib/requests/types";
import { storeBuzinessSearchParams } from "@/redux/reducers/buzinessReducer";
import { storeSearchText } from "@/redux/reducers/searchReducer";
import { storeUserSearchParams } from "@/redux/reducers/usersReducer";
import { removeFromPreviousSearches } from "@/redux/reducers/userReducer";
import { RootState } from "@/redux/store";
import { SearchMode } from "@/redux/store.type";
import { useFocusEffect, useLocalSearchParams, useNavigation } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Keyboard, Pressable, View } from "react-native";
import { Chip, Icon, Text } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { MODE_SWITCH_CLEARANCE } from "@/constants/layout";
import { BorderRadius } from "@/constants/borderRadius";

type ListItem =
  | { kind: "section"; label: string }
  | { kind: "previous"; query: string }
  | { kind: "suggestion"; query: string };

/** One search: what the screen shows, and what each entry of its history is. */
interface SearchState {
  mode: SearchMode;
  q: string;
  scope: RequestScope;
}

const MODES: { key: SearchMode; label: string; icon: string }[] = [
  { key: "biznisz", label: "Bizniszek", icon: "briefcase-outline" },
  { key: "kerelem", label: "Kérések", icon: "hand-heart-outline" },
  { key: "fife", label: "Fifék", icon: "account" },
];

const NO_HISTORY: string[] = [];
const SCOPES: RequestScope[] = ["all", "for_me", "mine", "solved"];
const isMode = (value: string | undefined): value is SearchMode =>
  MODES.some((m) => m.key === value);
const isScope = (value: string | undefined): value is RequestScope =>
  SCOPES.includes(value as RequestScope);

/** A value that starts over (as `initial`) whenever `key` changes. */
function useKeyedState<T>(key: string, initial: T) {
  const [state, setState] = useState({ key, value: initial });
  const value = state.key === key ? state.value : initial;
  const set = useCallback((next: T) => setState({ key, value: next }), [key]);
  return [value, set] as const;
}

/**
 * The one place every search happens, and one screen whatever it shows: the chips, the queries
 * and the filters change what is on it, never the route, so nothing slides in and out and the
 * one map stays loaded while only its pins change. The searches are a history of their own
 * (useSearchHistory): a chip starts the default search of its category (new bizniszek, the FiFe
 * Radar, the kérések for you), a typed query a concrete one, and Back steps through them — the
 * empty ones too — before it leaves the screen.
 */
export default function SearchScreen() {
  const theme = useAppTheme();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  // What the screen was opened with. `focus` comes from a search box that was tapped
  // (FakeSearchInput): the keyboard opens.
  const params = useLocalSearchParams<{ mode?: string; q?: string; scope?: string; focus?: string }>();
  const fromParams = useCallback(
    (): SearchState => ({
      mode: isMode(params.mode) ? params.mode : "biznisz",
      q: typeof params.q === "string" ? params.q : "",
      scope: isScope(params.scope) ? params.scope : "for_me",
    }),
    [params.mode, params.q, params.scope],
  );
  const history = useSearchHistory<SearchState>(fromParams());
  const { mode, q, scope } = history.current;
  const stateKey = `${history.depth}|${mode}|${q}|${scope}`;
  const autoFocus = params.focus === "1" && history.depth === 1;

  // Somebody arrives with a request of their own (a link, a tab press) while this screen is
  // already open: that is a new first search, not one more step.
  const paramsKey = `${params.mode}|${params.q}|${params.scope}|${params.focus}`;
  const lastParamsKey = useRef(paramsKey);
  const { reset } = history;
  useEffect(() => {
    if (lastParamsKey.current === paramsKey) return;
    lastParamsKey.current = paramsKey;
    reset(fromParams());
  }, [paramsKey, fromParams, reset]);

  const buzinessCircle = useSelector((state: RootState) => state.buziness.searchParams?.searchCircle);
  const buzinessIngyen = useSelector((state: RootState) => state.buziness.searchParams?.ingyen) ?? false;
  const buzinessLoading = useSelector((state: RootState) => state.buziness.searchParams?.loading) ?? false;
  const buzinesses = useSelector((state: RootState) => state.buziness.buzinesses);
  const view = useSelector((state: RootState) => state.search.view);
  const fifeCircle = useSelector((state: RootState) => state.users.userSearchParams?.searchCircle);
  // What is typed in the box right now; the "Új kérés" buttons carry it into the modal.
  const [typed, setTyped] = useKeyedState(stateKey, q);
  // The previous searches are for the moment the user taps into the box, and no longer.
  const [inputFocused, setInputFocused] = useKeyedState(stateKey, autoFocus);
  // Bumped when the chip of the search already on screen is tapped: load it again.
  const [reloadKey, setReloadKey] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  // The pin that is picked, valid for this search and this view only.
  const [selectedId, setSelectedId] = useKeyedState<string | number | null>(`${stateKey}|${view}`, null);

  // Each mode keeps its own history: a name you looked up is not a biznisz query.
  const previousBuzinessSearches = useSelector((state: RootState) => state.user.previousSearches);
  const previousProfileSearches = useSelector(
    (state: RootState) => state.user.previousProfileSearches,
  );
  // The kérések keep no history.
  const previousSearches =
    mode === "fife" ? previousProfileSearches : mode === "kerelem" ? NO_HISTORY : previousBuzinessSearches;
  const suggestions = useSearchSuggestions(typed, inputFocused && mode === "biznisz");

  // The data of the three tabs. The hooks live here, not in the tabs, so the one map can show
  // whichever of them is open; only the open tab loads anything.
  const { canLoadMore, search, loadNext, error } = useBuzinessSearch();
  const fife = useFifeResults({ enabled: mode === "fife", q, reloadKey, view });
  const requests = useRequestResults({ enabled: mode === "kerelem", q, scope, reloadKey, view });
  // The bizniszek live in redux (the list and the map share them), so the search on screen has
  // to put itself there again when the screen comes back into focus.
  useFocusEffect(
    useCallback(() => {
      dispatch(storeSearchText(q));
    }, [q, dispatch]),
  );
  useFocusEffect(
    useCallback(() => {
      if (mode !== "biznisz") return;
      search(q);
      // reloadKey is not read: bumping it is how a tap on the active chip asks for a reload. The
      // view is: the map asks for every pin, the list for pages, and each is its own search.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, q, reloadKey, view, dispatch, search]),
  );

  const { push } = history;
  const handleSearch = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      // The empty search is the category's default one, and is a history entry like any other.
      if (!q) setReloadKey((k) => k + 1);
      else push({ mode, q: "", scope });
      return;
    }
    if (mode === "kerelem") {
      // The default slice is "for you", which is a poor place to look something up in.
      push({ mode, q: trimmed, scope: scope === "for_me" ? "all" : scope });
      return;
    }
    runSearch(dispatch, trimmed, mode, (next) => push({ mode: next, q: trimmed, scope }));
  }, [dispatch, mode, q, scope, push]);

  const { back } = history;
  const backRef = useRef(back);
  useEffect(() => {
    backRef.current = back;
  });
  useEffect(() => {
    navigation.setOptions({
      // The iOS swipe would leave the screen: while there is a search to step back to, Back is
      // ours (the arrow below, the hardware and the browser buttons).
      gestureEnabled: history.depth <= 1,
      header: () => (
        <MyAppbar
          onBack={() => backRef.current()}
          center={
            <BuzinessSearchInput
              key={stateKey}
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
  }, [navigation, handleSearch, mode, q, autoFocus, stateKey, history.depth, setInputFocused, setTyped]);

  const openMode = (next: SearchMode) => {
    const nextScope: RequestScope = next === "kerelem" ? "for_me" : scope;
    // The same default search as the one on screen: load it again instead of stacking a twin.
    if (next === mode && !q && (next !== "kerelem" || scope === "for_me")) {
      setReloadKey((k) => k + 1);
      return;
    }
    push({ mode: next, q: "", scope: nextScope });
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
  const { title, filters } = searchTitle({
    mode,
    q,
    scope,
    ingyen: buzinessIngyen,
    hasCircle: mode === "fife" ? !!fifeCircle : !!buzinessCircle,
  });

  // ── The map: one instance, the pins of the open tab, and a quick list item for the picked one.
  const biznisPins = useMemo(() => {
    if (mode !== "biznisz" || view !== "map") return [];
    return buzinesses.flatMap((b) => {
      if (b.id < 0 || !b.location) return [];
      try {
        const [longitude, latitude] = locationToCoords(String(b.location));
        return Number.isFinite(latitude) && Number.isFinite(longitude)
          ? [{ buziness: b, latitude, longitude }]
          : [];
      } catch {
        return [];
      }
    });
  }, [mode, view, buzinesses]);

  const mapContent = (() => {
    if (view !== "map") return null;
    if (mode === "biznisz") {
      const selected = biznisPins.find((p) => p.buziness.id === selectedId);
      return {
        markers: biznisPins.map(({ buziness, latitude, longitude }) => (
          <Marker
            key={buziness.id}
            coordinate={{ latitude, longitude }}
            title={buziness.title.split(" $ ")[0]}
            anchor={{ x: 0.5, y: 0.5 }}
            zIndex={buziness.id === selectedId ? 10 : 1}
            onPress={() => setSelectedId(buziness.id)}
          >
            <BuzinessPin selected={buziness.id === selectedId} />
          </Marker>
        )),
        card: selected ? <BuzinessItem data={selected.buziness} /> : undefined,
        loading: buzinessLoading,
        searchHere: (area: { latitude: number; longitude: number; radius: number }) => {
          const searchCircle = {
            location: { latitude: area.latitude, longitude: area.longitude },
            radius: area.radius,
          };
          dispatch(storeBuzinessSearchParams({ searchCircle }));
          search(q, { searchCircle });
        },
      };
    }
    if (mode === "fife") {
      const selected = fife.pinned.find((p) => p.id === selectedId);
      return {
        markers: fife.pinned.map((profile) => (
          <Marker
            key={profile.id}
            coordinate={{ latitude: profile.lat, longitude: profile.long }}
            anchor={{ x: 0.5, y: 0.5 }}
            zIndex={profile.id === selectedId ? 10 : 1}
            onPress={() => setSelectedId(profile.id)}
          >
            <FifePin profile={profile} selected={profile.id === selectedId} />
          </Marker>
        )),
        card: selected ? <UserItem data={selected} /> : undefined,
        loading: fife.loading,
        searchHere: (area: { latitude: number; longitude: number; radius: number }) => {
          dispatch(
            storeUserSearchParams({
              searchCircle: {
                location: { latitude: area.latitude, longitude: area.longitude },
                radius: area.radius,
              },
            }),
          );
        },
      };
    }
    const selected = requests.pinned.find((r) => r.id === selectedId);
    return {
      markers: requests.pinned.map((request) => (
        <Marker
          key={request.id}
          coordinate={{ latitude: request.lat as number, longitude: request.long as number }}
          anchor={{ x: 0.5, y: 0.5 }}
          zIndex={request.id === selectedId ? 10 : 1}
          onPress={() => setSelectedId(request.id)}
        >
          <RequestPin selected={request.id === selectedId} solved={request.status === "solved"} />
        </Marker>
      )),
      card: selected ? (
        <RequestCard
          data={selected}
          onDeleted={(id) => {
            setSelectedId(null);
            requests.remove(id);
          }}
          onBlocked={() => requests.load(scope, q, requests.activeCenter)}
          onSolved={(id) => (scope === "mine" ? requests.patch(id, { status: "solved" }) : requests.remove(id))}
        />
      ) : undefined,
      loading: requests.loading,
      searchHere: (area: { latitude: number; longitude: number; radius: number }) =>
        requests.setCenter({ lat: area.latitude, long: area.longitude }),
    };
  })();

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
          gap: Spacing.sm,
          paddingLeft: Spacing.lg,
          paddingRight: Spacing.md,
          paddingVertical: Spacing.xs,
        }}
      >
        <View style={{ flex: 1 }}>
          <ThemedText
            testID="search-title"
            variant="labelLarge"
            type="bold"
            numberOfLines={2}
            style={{ color: theme.colors.secondary }}
          >
            {title}
          </ThemedText>
          {filters.length > 0 && (
            <Text
              testID="search-title-filters"
              variant="labelSmall"
              numberOfLines={1}
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {filters.join(", ")}
            </Text>
          )}
        </View>
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
        {/* The top right corner, in the list and on the map alike. */}
        <ViewSwitch
          onBeforeSwitch={() => {
            // The previous searches stand in for the results while the box is focused: leave
            // it, or the switch would flip its icon and show nothing new.
            Keyboard.dismiss();
            setInputFocused(false);
          }}
        />
      </ThemedView>

      {showHistory ? (
        <FlatList
          data={listData}
          keyExtractor={(item, i) => item.kind + (item.kind === "section" ? item.label : item.query) + i}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: MODE_SWITCH_CLEARANCE }}
          ListHeaderComponent={
            <View style={{ paddingHorizontal: Spacing.md, paddingTop: Spacing.sm }}>
              <NewRequestButton text={typed} testID="search-new-request-history" />
            </View>
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
      ) : mapContent ? (
        <View style={{ flex: 1 }}>
          <SearchMap
            onBackgroundPress={() => setSelectedId(null)}
            card={mapContent.card}
            onSearchHere={mapContent.searchHere}
            searchHereLoading={mapContent.loading}
          >
            {mapContent.markers}
          </SearchMap>
          {mode === "fife" && fife.isSearching && (
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                left: Spacing.md,
                right: Spacing.md,
                top: Spacing.sm,
                padding: Spacing.sm,
                borderRadius: BorderRadius.md,
                backgroundColor: theme.colors.surface,
              }}
            >
              <ThemedText variant="labelMedium" style={{ textAlign: "center" }}>
                A névkeresés találatai nem jelennek meg a térképen.
              </ThemedText>
            </View>
          )}
        </View>
      ) : mode === "biznisz" ? (
        <BuzinessResults canLoadMore={canLoadMore} loadNext={loadNext} error={error} typed={typed} />
      ) : mode === "fife" ? (
        <UsersList {...fife.list} />
      ) : (
        <RequestList
          data={requests.data}
          loading={requests.loading}
          fetched={requests.fetched}
          error={requests.error}
          q={q}
          scope={scope}
          typed={typed}
          onEndReached={requests.loadMore}
          onDeleted={requests.remove}
          onBlocked={() => requests.load(scope, q, requests.activeCenter)}
          onSolved={(id) =>
            // An archived request leaves every slice but "mine" and "solved".
            scope === "mine" ? requests.patch(id, { status: "solved" }) : requests.remove(id)
          }
        />
      )}

      <SearchFilterModal
        mode={mode}
        scope={scope}
        onScopeChange={(next) => history.replace({ mode, q, scope: next })}
        onBuzinessApplied={(searchCircle, ingyen) => search(q, { searchCircle, ingyen })}
        visible={filterOpen}
        onDismiss={() => setFilterOpen(false)}
      />
    </ThemedView>
  );
}
