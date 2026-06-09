import { Spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/borderRadius";
import {
  storeBuzinessSearchParams
} from "@/redux/reducers/buzinessReducer";
import { RootState } from "@/redux/store";
import { Icon, TouchableRipple } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { useAppTheme } from "@/assets/theme";
import { ThemedView } from "./ThemedView";
import Smiley from "./Smiley";
import { TextInput, View, FlatList, Pressable, Text, StyleSheet } from "react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import { useSearchSuggestions } from "@/hooks/useSearchSuggestions";

const BuzinessSearchInput = ({ onSearch, autoFocus = false, showSuggestionsDropdown = true }: { onSearch: (query: string) => void; autoFocus?: boolean; showSuggestionsDropdown?: boolean }) => {
  const dispatch = useDispatch();
  const theme = useAppTheme();

  const canSearch = true;
  const searchText = useSelector((state: RootState) => state.buziness.searchParams?.text ?? "");
  const [inputText, setInputText] = useState(searchText);
  const [focused, setFocused] = useState(autoFocus);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const greeting = useMemo(() => {
    const greetings = ["Üdv a FiFe Appban!", "Mire van szükséged?", "Keress bizniszekre..."];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }, []);

  const showSuggestions = focused && showSuggestionsDropdown;
  const suggestions = useSearchSuggestions(inputText, showSuggestions);

  const handleChangeText = useCallback((text: string) => {
    if (text.includes("$")) return;
    setInputText(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      dispatch(storeBuzinessSearchParams({ text }));
    }, 400);
  }, [dispatch]);

  const handleSelectSuggestion = useCallback((query: string) => {
    setInputText(query);
    dispatch(storeBuzinessSearchParams({ text: query }));
    setFocused(false);
    onSearch(query);
  }, [dispatch, onSearch]);

  const handleSubmit = useCallback(() => {
    setFocused(false);
    onSearch(inputText);
  }, [inputText, onSearch]);

  return (
    <View style={{ flex: 1 }}>
      <ThemedView style={{ flex: 1, flexDirection: "row", gap: Spacing.md, alignItems: "center", justifyContent: "center" }} type="card">
        <Smiley style={{ width: 35, height: 35, zIndex: 100000 }} />
        <View style={{ flex: 1, height: 40, flexDirection: "row", alignItems: "center", backgroundColor: theme.colors.background, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md }}>
          <TextInput
            value={inputText}
            autoFocus={autoFocus}
            style={{ flex: 1, height: 40, fontFamily: "RedHatText", fontWeight: "300", color: theme.colors.onSurface }}
            onChangeText={handleChangeText}
            onSubmitEditing={handleSubmit}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            enterKeyHint="search"
            textAlign={inputText ? "left" : "center"}
            placeholderTextColor={theme.colors.onSurfaceVariant}
            placeholder={greeting}
          />
          <TouchableRipple onPress={handleSubmit} disabled={!canSearch} borderless style={{ borderRadius: 20, padding: Spacing.xs }}>
            <Icon source="magnify" size={22} color={theme.colors.onSurface} />
          </TouchableRipple>
        </View>
      </ThemedView>

      {showSuggestions && suggestions.length > 0 && (
        <View style={[styles.dropdown, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.query_text}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handleSelectSuggestion(item.query_text)}
                style={({ pressed }) => [styles.suggestionRow, pressed && { backgroundColor: theme.colors.surfaceVariant }]}
              >
                <Icon source="magnify" size={16} color={theme.colors.onSurfaceVariant} />
                <Text style={[styles.suggestionText, { color: theme.colors.onSurface }]} numberOfLines={1}>
                  {item.query_text}
                </Text>
              </Pressable>
            )}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  dropdown: {
    position: "absolute",
    top: 58,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    zIndex: 9999,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  suggestionText: {
    fontFamily: "RedHatText",
    fontWeight: "300",
    fontSize: 14,
    flex: 1,
  },
});

export default BuzinessSearchInput;
