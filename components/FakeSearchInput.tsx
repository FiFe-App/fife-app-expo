import { Spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/borderRadius";
import { SearchMode } from "@/redux/store.type";
import { Icon } from "react-native-paper";
import { useAppTheme } from "@/assets/theme";
import { ThemedView } from "./ThemedView";
import Smiley from "./Smiley";
import { Pressable, Text, View } from "react-native";
import { useMemo } from "react";
import { router } from "expo-router";
import { searchHref } from "@/lib/search/href";
import { useAppMode } from "@/lib/mode/appMode";

const FakeSearchInput = ({ mode = "biznisz" }: { mode?: SearchMode }) => {
  const theme = useAppTheme();
  const appMode = useAppMode();

  const greeting = useMemo(() => {
    if (mode === "fife") return "Keress fifékre...";
    const greetings = ["Üdv a FiFe Appban!", "Mire van szükséged?", "Keress bizniszekre..."];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }, [mode]);

  return (
    <ThemedView style={{ flex: 1, flexDirection: "row", gap: Spacing.md, alignItems: "center", justifyContent: "center" }} type="card">
      {appMode == "en" && <Smiley style={{ width: 35, height: 35, zIndex: 100000 }} />}
      <Pressable
        onPress={() => router.push(searchHref(mode, { focus: true }))}
        style={{
          flex: 1,
          height: 40,
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: theme.colors.background,
          borderRadius: BorderRadius.full,
          paddingHorizontal: Spacing.md,
        }}
      >
        <Icon source="magnify" size={22} color={theme.colors.onSurface} />
        <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: Spacing.sm }}>
          <Text
            numberOfLines={1}
            style={{
              fontFamily: "RedHatText",
              fontWeight: "300",
              color: theme.colors.onSurfaceVariant,
              textAlign: "center",
            }}
          >
            {greeting}
          </Text>
        </View>
      </Pressable>
    </ThemedView>
  );
};

export default FakeSearchInput;
