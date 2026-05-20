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
import { TextInput, View } from "react-native";
import { useCallback, useMemo, useRef, useState } from "react";

const BuzinessSearchInput = ({ onSearch }: { onSearch: (query: string) => void }) => {
  const dispatch = useDispatch();
  const theme = useAppTheme();

  const canSearch = true;
  const searchText = useSelector((state: RootState) => state.buziness.searchParams?.text ?? "");
  const [inputText, setInputText] = useState(searchText);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const greeting = useMemo(() => {
    const greetings = ["Üdv a FiFe Appban!", "Mire van szükséged?", "Keress bizniszekre..."];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }, []);

  const handleChangeText = useCallback((text: string) => {
    if (text.includes("$")) return;
    setInputText(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      dispatch(storeBuzinessSearchParams({ text }));
    }, 400);
  }, [dispatch, onSearch]);

  return (
    <ThemedView style={{ flex: 1, flexDirection: "row", gap: Spacing.md, alignItems: "center", justifyContent: "center" }} type="card">
      <Smiley style={{ width: 35, height: 35, zIndex: 100000 }} />
      <View style={{ flex: 1, height: 40, flexDirection: "row", alignItems: "center", backgroundColor: theme.colors.background, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md }}>
        <TextInput
          value={inputText}
          style={{ flex: 1, height: 40, fontFamily: "RedHatText", fontWeight: "300", color: theme.colors.onSurface }}
          onChangeText={handleChangeText}
          onSubmitEditing={() => onSearch(inputText)}
          enterKeyHint="search"
          textAlign={inputText ? "left" : "center" }
          placeholderTextColor={theme.colors.onSurfaceVariant}
          placeholder={greeting}
        />
        <TouchableRipple onPress={() => onSearch(inputText)} disabled={!canSearch} borderless style={{ borderRadius: 20, padding: Spacing.xs }}>
          <Icon source="magnify" size={22} color={theme.colors.onSurface} />
        </TouchableRipple>
      </View>
    </ThemedView>
  );
};

export default BuzinessSearchInput;