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
import { openRequestComposer } from "@/redux/reducers/requestsReducer";
import { removeFromPreviousSearches } from "@/redux/reducers/userReducer";
import { RootState } from "@/redux/store";
import { SearchMode } from "@/redux/store.type";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
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

export default function SearchScreen() {
  const theme = useAppTheme();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ mode?: string }>();
  const [mode, setMode] = useState<SearchMode>(isMode(params.mode) ? params.mode : "biznisz");

  const buzinessText = useSelector((state: RootState) => state.buziness.searchParams?.text ?? "");
  const fifeText = useSelector((state: RootState) => state.users.userSearchParams?.text ?? "");
  const requestText = useSelector((state: RootState) => state.requests.searchText);
  const searchText =
    mode === "fife" ? fifeText : mode === "kerelem" ? requestText : buzinessText;
  // Each mode keeps its own history: a name you looked up is not a biznisz query.
  const previousBuzinessSearches = useSelector((state: RootState) => state.user.previousSearches);
  const previousProfileSearches = useSelector(
    (state: RootState) => state.user.previousProfileSearches,
  );
  const previousRequestSearches = useSelector(
    (state: RootState) => state.user.previousRequestSearches,
  );
  const previousSearches =
    mode === "fife"
      ? previousProfileSearches
      : mode === "kerelem"
        ? previousRequestSearches
        : previousBuzinessSearches;

  const suggestions = useSearchSuggestions(searchText, mode === "biznisz");

  // Opened from the menu (no mode in the route) the screen is for browsing: no keyboard, no
  // history, just what is new. Opened from a search box (FakeSearchInput always passes a mode),
  // or once the user taps into the box, it is for searching.
  const [engaged, setEngaged] = useState(isMode(params.mode));
  const browsing = !engaged;
  const browseBizniszek = useNearbyBuzinesses(10, { personalised: false });
  const browseRequests = useRequests(10);
  const { fetch: fetchNewBizniszek } = browseBizniszek;
  const { load: loadNewRequests } = browseRequests;
  useEffect(() => {
    if (!browsing) return;
    if (mode === "biznisz") fetchNewBizniszek();
    if (mode === "kerelem") loadNewRequests("all");
  }, [browsing, mode, fetchNewBizniszek, loadNewRequests]);

  const handleSearch = useCallback((query: string) => {
    runSearch(dispatch, query, mode, "replace");
  }, [dispatch, mode]);

  useEffect(() => {
    navigation.setOptions({
      header: () => (
        <MyAppbar
          // key re-seeds the input's local text from the other slice on a flip.
          center={<BuzinessSearchInput key={mode} mode={mode} onSearch={handleSearch} autoFocus={engaged} onFocus={() => setEngaged(true)} showSuggestionsDropdown={false} />}
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

  return (
    <ThemedView style={{ flex: 1 }} type="default">
      <ThemedView
        type="card"
        style={{
          flexDirection: "row",
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
              onPress={() => setMode(m.key)}
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
      </ThemedView>
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
      {browsing && mode === "kerelem" && (
        <FlatList
          testID="search-browse-requests"
          data={browseRequests.data}
          keyExtractor={(item) => String(item.id)}
          onEndReachedThreshold={0.6}
          onEndReached={browseRequests.loadMore}
          contentContainerStyle={{
            padding: Spacing.md,
            gap: Spacing.sm,
            paddingBottom: MODE_SWITCH_CLEARANCE + Spacing.md,
          }}
          ListHeaderComponent={
            <ThemedText variant="labelLarge" type="bold" style={{ color: theme.colors.secondary }}>
              Új kérések
            </ThemedText>
          }
          renderItem={({ item }) => (
            <RequestCard
              data={item}
              onDeleted={browseRequests.remove}
              onSolved={browseRequests.remove}
            />
          )}
          ListFooterComponent={
            browseRequests.loading ? <ActivityIndicator style={{ marginVertical: Spacing.lg }} /> : null
          }
          ListEmptyComponent={
            browseRequests.error ? (
              <ThemedText type="error" style={{ textAlign: "center" }}>{browseRequests.error}</ThemedText>
            ) : browseRequests.fetched && !browseRequests.loading ? (
              <ThemedText style={{ textAlign: "center", padding: Spacing.lg }}>
                Még nincs kérés.
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
      {!browsing && mode === "kerelem" && !!searchText.trim() && (
        // Nobody asked for this yet? The typed text becomes the title of a new request.
        <Pressable
          testID="search-new-request"
          onPress={() => dispatch(openRequestComposer(searchText))}
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
          <ThemedText
            type="bold"
            numberOfLines={1}
            style={{ flex: 1, color: theme.colors.primary }}
          >
            Új kérés: „{searchText.trim()}”
          </ThemedText>
        </Pressable>
      )}
      {!browsing && (
      <FlatList
        data={listData}
        keyExtractor={(item, i) => item.kind + (item.kind === "section" ? item.label : item.query) + i}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: MODE_SWITCH_CLEARANCE }}
        ListEmptyComponent={
          mode === "fife" || mode === "kerelem" ? (
            <View style={{ padding: Spacing.lg }}>
              <ThemedText
                variant="labelMedium"
                style={{ color: theme.colors.onSurfaceVariant, textAlign: "center" }}
              >
                {mode === "fife"
                  ? "Írd be egy fife nevét vagy @felhasználónevét."
                  : "Írd be, mit keresel a kérések között: címet, leírást vagy kulcsszót."}
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
    </ThemedView>
  );
}
