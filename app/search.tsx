import BuzinessSearchInput from "@/components/BuzinessSearchInput";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Spacing } from "@/constants/spacing";
import { useAppTheme } from "@/assets/theme";
import { useSearchSuggestions } from "@/hooks/useSearchSuggestions";
import { storeBuzinesses, storeBuzinessSearchParams } from "@/redux/reducers/buzinessReducer";
import { storeUserSearchParams } from "@/redux/reducers/usersReducer";
import { addPreviousSearch, removeFromPreviousSearches } from "@/redux/reducers/userReducer";
import { RootState } from "@/redux/store";
import { SearchMode } from "@/redux/store.type";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { Chip, Icon } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { MyAppbar } from "@/components/MyAppBar";
import { BorderRadius } from "@/constants/borderRadius";

type ListItem =
  | { kind: "section"; label: string }
  | { kind: "previous"; query: string }
  | { kind: "suggestion"; query: string };

const MODES: { key: SearchMode; label: string; icon: string }[] = [
  { key: "biznisz", label: "bizniszek", icon: "briefcase-outline" },
  { key: "fife", label: "fifék", icon: "wifi" },
];

export default function SearchScreen() {
  const theme = useAppTheme();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ mode?: string }>();
  const [mode, setMode] = useState<SearchMode>(params.mode === "fife" ? "fife" : "biznisz");

  const buzinessText = useSelector((state: RootState) => state.buziness.searchParams?.text ?? "");
  const fifeText = useSelector((state: RootState) => state.users.userSearchParams?.text ?? "");
  const searchText = mode === "fife" ? fifeText : buzinessText;
  const previousSearches = useSelector((state: RootState) => state.user.previousSearches ?? []);

  const suggestions = useSearchSuggestions(searchText, mode === "biznisz");

  const handleSearch = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    dispatch(addPreviousSearch(trimmed));
    if (mode === "fife") {
      dispatch(storeUserSearchParams({ text: trimmed, skip: 0 }));
      router.replace("/fifeRadar");
      return;
    }
    dispatch(storeBuzinessSearchParams({ text: trimmed }));
    dispatch(storeBuzinesses([]));
    router.replace("/biznisz");
  }, [dispatch, mode]);

  useEffect(() => {
    navigation.setOptions({
      header: () => (
        <MyAppbar
          // key re-seeds the input's local text from the other slice on a flip.
          center={<BuzinessSearchInput key={mode} mode={mode} onSearch={handleSearch} autoFocus showSuggestionsDropdown={false} />}
          style={{ elevation: 0, shadowOpacity: 0, borderBottomWidth: 0 }}
        />
      ),
    });
  }, [navigation, handleSearch, mode]);

  const listData = useMemo<ListItem[]>(() => {
    const prev = previousSearches.filter((q) =>
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
      <FlatList
        data={listData}
        keyExtractor={(item, i) => item.kind + (item.kind === "section" ? item.label : item.query) + i}
        keyboardShouldPersistTaps="handled"
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
                  onPress={() => dispatch(removeFromPreviousSearches(item.query))}
                  hitSlop={8}
                >
                  <Icon source="close" size={18} color={theme.colors.onSurfaceVariant} />
                </Pressable>
              )}
            </Pressable>
          );
        }}
      />
    </ThemedView>
  );
}
