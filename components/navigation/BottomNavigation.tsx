import { router, useSegments } from "expo-router";
import { useRef, useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { Badge, Icon, TouchableRipple } from "react-native-paper";
import { ThemedText } from "../ThemedText";
import { useSelector } from "react-redux";
import { Spacing } from "@/constants/spacing";
import { RootState } from "@/redux/store";
import globStyles from "@/constants/Styles";
import { theme } from "@/assets/theme";
import Measure from "../tutorial/Measure";
import { ThemedView } from "../ThemedView";
const BottomNavigation = () => {
  const segment = useSegments();
  const { functions } = useSelector((state: RootState) => state.tutorial);

  const bizniszActive = segment[0]?.includes("biznisz");
  const meActive = segment[0] === "me" || segment[0]?.includes("user");
  const homeActive = segment[0]?.includes("home") || segment[0]?.includes("fifeRadar");
  const lastNavTime = useRef(0);

  const navigateTo = useCallback((path: "/biznisz" | "/home" | "/me") => {
    const now = Date.now();
    if (now - lastNavTime.current < 300) return;
    lastNavTime.current = now;
    router.navigate(path);
  }, []);

  return (
    <ThemedView style={{ flexDirection: "row", backgroundColor: theme.colors.elevation.level0 }}>
      <Measure name="biznisz">
        <TouchableRipple style={{ ...styles.button }} onPress={() => navigateTo("/biznisz")}>
          <View style={{ alignItems: "center" }}>
            <Icon
              source="magnify"
              size={bizniszActive ? 30 : 24}
              color={bizniszActive ? theme.colors.secondary : undefined}
            />
            <ThemedText type={bizniszActive ? "defaultSemiBold" : "default"}>
              Biznisz
            </ThemedText>
            {functions.includes("buzinessPage") && (
              <Badge style={globStyles.badge}>ÚJ</Badge>
            )}
          </View>
        </TouchableRipple>
      </Measure>
      <Measure name="home">
        <TouchableRipple style={{ ...styles.button }} onPress={() => navigateTo("/home")}>
          <View style={{ alignItems: "center" }}>
            <Icon
              source={homeActive ? "account-group" : "account-group-outline"}
              size={homeActive ? 30 : 24}
              color={homeActive ? theme.colors.secondary : undefined}
            />
            <ThemedText type={homeActive ? "defaultSemiBold" : "default"}>
              Ti
            </ThemedText>
          </View>
        </TouchableRipple>
      </Measure>
      <Measure name="user">
        <TouchableRipple style={{ ...styles.button }} onPress={() => navigateTo("/me")}>
          <View style={{ alignItems: "center" }}>
            <Icon
              source={meActive ? "account" : "account-outline"}
              size={meActive ? 30 : 24}
              color={meActive ? theme.colors.secondary : undefined}
            />
            <ThemedText type={meActive ? "defaultSemiBold" : "default"}>
              Én
            </ThemedText>
          </View>
        </TouchableRipple>
      </Measure>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  button: {
    flex: 1,
    padding: Spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default BottomNavigation;
