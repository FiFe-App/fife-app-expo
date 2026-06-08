import BuzinessSearchInput from "@/components/BuzinessSearchInput";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { Spacing } from "@/constants/spacing";
import { useAppTheme } from "@/assets/theme";
import { useSearchSuggestions } from "@/hooks/useSearchSuggestions";
import { storeBuzinesses, storeBuzinessSearchParams } from "@/redux/reducers/buzinessReducer";
import { RootState } from "@/redux/store";
import { router, useNavigation } from "expo-router";
import { useCallback, useEffect } from "react";
import { FlatList, Pressable, View } from "react-native";
import { Icon } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { MyAppbar } from "@/components/MyAppBar";

export default function SearchScreen() {
  const theme = useAppTheme();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const searchText = useSelector((state: RootState) => state.buziness.searchParams?.text ?? "");

  const suggestions = useSearchSuggestions(searchText, true);

  const handleSearch = useCallback((query: string) => {
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

  return (
    <ThemedView style={{ flex: 1 }} type="default">
      {suggestions.length > 0 && (
        <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm }}>
          <ThemedText variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Gyakori keresések
          </ThemedText>
        </View>
      )}
      <FlatList
        data={suggestions}
        keyExtractor={(item) => item.query_text}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handleSearch(item.query_text)}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: Spacing.md,
              paddingHorizontal: Spacing.lg,
              paddingVertical: Spacing.md,
              backgroundColor: pressed ? theme.colors.surfaceVariant : "transparent",
            })}
          >
            <Icon source="magnify" size={20} color={theme.colors.onSurfaceVariant} />
            <ThemedText style={{ flex: 1, color: theme.colors.onSurface }} numberOfLines={1}>
              {item.query_text}
            </ThemedText>
          </Pressable>
        )}
      />
    </ThemedView>
  );
}
