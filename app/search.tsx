import BuzinessSearchInput from "@/components/BuzinessSearchInput";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Spacing } from "@/constants/spacing";
import { useAppTheme } from "@/assets/theme";
import { useSearchSuggestions } from "@/hooks/useSearchSuggestions";
import { storeBuzinesses, storeBuzinessSearchParams } from "@/redux/reducers/buzinessReducer";
import { addPreviousSearch, removeFromPreviousSearches } from "@/redux/reducers/userReducer";
import { RootState } from "@/redux/store";
import { router, useNavigation } from "expo-router";
import { useCallback, useEffect, useMemo } from "react";
import { FlatList, Pressable } from "react-native";
import { Icon } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { MyAppbar } from "@/components/MyAppBar";

type ListItem =
  | { kind: "section"; label: string }
  | { kind: "previous"; query: string }
  | { kind: "suggestion"; query: string };

export default function SearchScreen() {
  const theme = useAppTheme();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const searchText = useSelector((state: RootState) => state.buziness.searchParams?.text ?? "");
  const previousSearches = useSelector((state: RootState) => state.user.previousSearches ?? []);

  const suggestions = useSearchSuggestions(searchText, true);

  const handleSearch = useCallback((query: string) => {
    if (!query.trim()) return;
    dispatch(addPreviousSearch(query));
    dispatch(storeBuzinessSearchParams({ text: query }));
    dispatch(storeBuzinesses([]));
    router.replace("/biznisz");
  }, [dispatch]);

  useEffect(() => {
    navigation.setOptions({
      header: () => (
        <MyAppbar
          center={<BuzinessSearchInput onSearch={handleSearch} autoFocus showSuggestionsDropdown={false} />}
          style={{ elevation: 0, shadowOpacity: 0, borderBottomWidth: 0 }}
        />
      ),
    });
  }, [navigation, handleSearch]);

  const listData = useMemo<ListItem[]>(() => {
    const prev = previousSearches.filter((q) =>
      !searchText || q.toLowerCase().includes(searchText.toLowerCase())
    );
    const suggestionTexts = new Set(prev.map((q) => q.toLowerCase()));
    const filtered = suggestions.filter((s) => !suggestionTexts.has(s.query_text.toLowerCase()));

    const items: ListItem[] = [];
    if (prev.length > 0) {
      items.push({ kind: "section", label: "Korábbi keresések" });
      prev.forEach((q) => items.push({ kind: "previous", query: q }));
    }
    if (filtered.length > 0) {
      items.push({ kind: "section", label: "Gyakori keresések" });
      filtered.forEach((s) => items.push({ kind: "suggestion", query: s.query_text }));
    }
    return items;
  }, [previousSearches, suggestions, searchText]);

  return (
    <ThemedView style={{ flex: 1 }} type="default">
      <FlatList
        data={listData}
        keyExtractor={(item, i) => item.kind + (item.kind === "section" ? item.label : item.query) + i}
        keyboardShouldPersistTaps="handled"
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
