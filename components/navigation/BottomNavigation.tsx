import { Link, Route, router, useGlobalSearchParams, useSegments } from "expo-router";
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
  const globalParams = useGlobalSearchParams();
  const { functions } = useSelector((state: RootState) => state.tutorial);
  const { uid } = useSelector((state: RootState) => state.user);

  const bizniszActive = segment[0]?.includes("biznisz");
  const profilActive = segment[0]?.includes("user");
  const homeActive = segment[0]?.includes("home");
  const chatsActive = segment[0]?.includes("chat");
  const lastNavTime = useRef(0);

  const navigateTo = useCallback((path: Route, params?: Record<string,string>) => {
    const now = Date.now();
    if (now - lastNavTime.current < 300) return;

    if (params?.uid) {
      // Profile tab: skip only if already viewing own profile
      const alreadyOnMyProfile = segment[0] === "user" && globalParams.uid === uid;
      if (alreadyOnMyProfile) return;
    } else {
      // Other tabs: skip if already on the same segment
      if (segment[0] && path == segment[0]) return;
    }

    lastNavTime.current = now;
    router.navigate(path, params);
  }, [segment, uid, globalParams]);

  return (
    <ThemedView style={{ flexDirection: "row", backgroundColor: theme.colors.elevation.level0 }}>
      <Measure name="biznisz">
        <TouchableRipple style={{ ...styles.button }} onPress={() => navigateTo("/biznisz")}>
          <View style={{ alignItems: "center" }}>
            <Icon
              source="magnify"
              size={24}
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
              source={homeActive ? "home" : "home-outline"}
              size={24}
              color={homeActive ? theme.colors.secondary : undefined}
            />
            <ThemedText type={homeActive ? "defaultSemiBold" : "default"}>
              Otthon
            </ThemedText>
          </View>
        </TouchableRipple>
      </Measure>
      <Measure name="chats">
        <Link asChild href="/chats">
          <TouchableRipple style={{ ...styles.button }}>
            <View style={{ alignItems: "center" }}>
              <Icon
                source={chatsActive ? "message" : "message-outline"}
                size={24}
                color={chatsActive ? theme.colors.secondary : undefined}
              />
              <ThemedText type={chatsActive ? "defaultSemiBold" : "default"}>
                Üzenetek
              </ThemedText>
            </View>
          </TouchableRipple>
        </Link>
      </Measure>
      <Measure name="user">
        <TouchableRipple style={{ ...styles.button }} onPress={() => navigateTo("/user",{uid:uid!})}>
          <View style={{ alignItems: "center" }}>
            <Icon
              source={profilActive ? "account" : "account-outline"}
              size={24}
              color={profilActive ? theme.colors.secondary : undefined}
            />
            <ThemedText type={profilActive ? "defaultSemiBold" : "default"}>
              Profil
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
