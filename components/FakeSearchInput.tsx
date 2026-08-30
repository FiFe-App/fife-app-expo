import { Spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/borderRadius";
import { RootState } from "@/redux/store";
import { SearchMode } from "@/redux/store.type";
import { Icon } from "react-native-paper";
import { useSelector } from "react-redux";
import { useAppTheme } from "@/assets/theme";
import { ThemedView } from "./ThemedView";
import Smiley from "./Smiley";
import { Pressable, Text, View } from "react-native";
import { useMemo } from "react";
import { router } from "expo-router";

const FakeSearchInput = ({ mode = "biznisz" }: { mode?: SearchMode }) => {
  const theme = useAppTheme();
  // Both selectors always run — only which one is displayed depends on mode.
  const buzinessText = useSelector((state: RootState) => state.buziness.searchParams?.text ?? "");
  const fifeText = useSelector((state: RootState) => state.users.userSearchParams?.text ?? "");
  const searchText = mode === "fife" ? fifeText : buzinessText;

  const greeting = useMemo(() => {
    if (mode === "fife") return "Keress fifékre...";
    const greetings = ["Üdv a FiFe Appban!", "Mire van szükséged?", "Keress bizniszekre..."];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }, [mode]);

  return (
    <ThemedView style={{ flex: 1, flexDirection: "row", gap: Spacing.md, alignItems: "center", justifyContent: "center" }} type="card">
      <Smiley style={{ width: 35, height: 35, zIndex: 100000 }} />
      <Pressable
        onPress={() => router.push({ pathname: "/search", params: { mode } })}
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
              color: searchText ? theme.colors.onSurface : theme.colors.onSurfaceVariant,
              textAlign: searchText ? "left" : "center",
            }}
          >
            {searchText || greeting}
          </Text>
        </View>
      </Pressable>
    </ThemedView>
  );
};

export default FakeSearchInput;
