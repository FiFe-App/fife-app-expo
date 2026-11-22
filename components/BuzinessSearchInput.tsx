import { Spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/borderRadius";
import { SearchMode } from "@/redux/store.type";
import { Icon, TouchableRipple } from "react-native-paper";
import { useAppTheme } from "@/assets/theme";
import { ThemedView } from "./ThemedView";
import Smiley from "./Smiley";
import { TextInput, View, FlatList, Pressable, Text, StyleSheet } from "react-native";
import { useCallback, useState } from "react";
import { useSearchSuggestions } from "@/hooks/useSearchSuggestions";
import { useAppMode } from "@/lib/mode/appMode";

interface BuzinessSearchInputProps {
  onSearch: (query: string) => void;
  autoFocus?: boolean;
  showSuggestionsDropdown?: boolean;
  mode?: SearchMode;
  /** What the box starts with: the query of the search on screen. */
  initialText?: string;
  onFocus?: () => void;
  /** Fires a moment after the box lost focus, so a press on a list row still lands. */
  onBlur?: () => void;
  onChangeText?: (text: string) => void;
}

/**
 * The search box of the search screen. It keeps no search state of its own beyond what is
 * typed: the query being searched lives in the route, which is what makes Back step through
 * the searches.
 */
const BuzinessSearchInput = ({
  onSearch,
  autoFocus = false,
  showSuggestionsDropdown = true,
  mode = "biznisz",
  initialText = "",
  onFocus,
  onBlur,
  onChangeText,
}: BuzinessSearchInputProps) => {
  const theme = useAppTheme();
  const appMode = useAppMode();

  const canSearch = true;
  const [inputText, setInputText] = useState(initialText);
  const [focused, setFocused] = useState(autoFocus);

  const greeting = mode === "fife"
    ? "Keress fifékre (név vagy @felhasználónév)..."
    : mode === "kerelem"
      ? "Keress kérések között..."
      : "Keress bizniszekre...";

  // get_popular_search_queries is fed by buziness searches only.
  const showSuggestions = focused && showSuggestionsDropdown && mode === "biznisz";
  const suggestions = useSearchSuggestions(inputText, showSuggestions);

  const handleChangeText = useCallback((text: string) => {
    if (text.includes("$")) return;
    setInputText(text);
    onChangeText?.(text);
  }, [onChangeText]);

  const handleSelectSuggestion = useCallback((query: string) => {
    setInputText(query);
    onChangeText?.(query);
    setFocused(false);
    onSearch(query);
  }, [onChangeText, onSearch]);

  const handleSubmit = useCallback(() => {
    setFocused(false);
    onSearch(inputText);
  }, [inputText, onSearch]);

  const handleClear = () => {
    setInputText("");
    onChangeText?.("");
  };

  return (
    <View style={{ flex: 1 }}>
      <ThemedView style={{ flex: 1, flexDirection: "row", gap: Spacing.md, alignItems: "center", justifyContent: "center" }} type="card">
        {appMode == "en" && <Smiley style={{ width: 35, height: 35, zIndex: 100000 }} />}
        <View style={{ flex: 1, height: 40, flexDirection: "row", alignItems: "center", backgroundColor: theme.colors.background, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md }}>

          <TextInput
            value={inputText}
            autoFocus={autoFocus}
            style={{ flex: 1, height: 40, fontFamily: "RedHatText", fontWeight: "300", color: theme.colors.onSurface, paddingHorizontal: Spacing.sm }}
            onChangeText={handleChangeText}
            onSubmitEditing={handleSubmit}
            onFocus={() => {
              setFocused(true);
              onFocus?.();
            }}
            onBlur={() =>
              setTimeout(() => {
                setFocused(false);
                onBlur?.();
              }, 150)
            }
            enterKeyHint="search"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            placeholder={greeting}
          />
          <TouchableRipple onPress={handleSubmit} disabled={!canSearch} borderless style={{ borderRadius: 20, padding: Spacing.xs }}>
            <Icon source="magnify" size={22} color={theme.colors.backdrop}/>
          </TouchableRipple>
          {!!inputText.length && <TouchableRipple onPress={handleClear} disabled={!canSearch} borderless style={{ borderRadius: 20, padding: Spacing.xs }}>
            <Icon source="close" size={22} color={theme.colors.onSurface} />
          </TouchableRipple>}
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
