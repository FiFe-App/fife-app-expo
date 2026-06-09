import { Spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/borderRadius";
import { RootState } from "@/redux/store";
import { Icon } from "react-native-paper";
import { useSelector } from "react-redux";
import { useAppTheme } from "@/assets/theme";
import { ThemedView } from "./ThemedView";
import Smiley from "./Smiley";
import { Pressable, Text, View } from "react-native";
import { useMemo } from "react";
import { router } from "expo-router";

const FakeSearchInput = () => {
  const theme = useAppTheme();
  const searchText = useSelector((state: RootState) => state.buziness.searchParams?.text ?? "");

  const greeting = useMemo(() => {
    const greetings = ["Üdv a FiFe Appban!", "Mire van szükséged?", "Keress bizniszekre..."];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }, []);

  return (
    <ThemedView style={{ flex: 1, flexDirection: "row", gap: Spacing.md, alignItems: "center", justifyContent: "center" }} type="card">
      <Smiley style={{ width: 35, height: 35, zIndex: 100000 }} />
      <Pressable
        onPress={() => router.push("/search")}
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
        <View style={{ flex: 1, justifyContent: "center" }}>
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
        <Icon source="magnify" size={22} color={theme.colors.onSurface} />
      </Pressable>
    </ThemedView>
  );
};

export default FakeSearchInput;
