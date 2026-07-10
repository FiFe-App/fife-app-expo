import { Route, router, useGlobalSearchParams, useSegments } from "expo-router";
import { useRef, useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { Icon, TouchableRipple } from "react-native-paper";
import { ThemedText } from "../ThemedText";
import { useSelector } from "react-redux";
import { Spacing } from "@/constants/spacing";
import { RootState } from "@/redux/store";
import { useAppTheme } from "@/assets/theme";
import Measure from "../tutorial/Measure";
import { ThemedView } from "../ThemedView";

const BottomNavigation = () => {
  const segment = useSegments();
  const globalParams = useGlobalSearchParams();
  const theme = useAppTheme();
  const { uid } = useSelector((state: RootState) => state.user);

  const profilActive = segment[0]?.includes("user");
  const meActive = segment[0] === "me";
  const usActive = segment[0]?.includes("home") || segment[0]?.includes("fifeRadar");
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

  const showIcon = true;
  const showText = false;

  return (
    <ThemedView type="card" style={{ flexDirection: "row", backgroundColor: theme.colors.elevation.level1 }}>
      <Measure name="home">
        <TouchableRipple style={{ ...styles.button }} onPress={() => navigateTo("/home")}>
          <View style={{ alignItems: "center" }}>
            {showIcon && <Icon
              source={usActive ? "account-group" : "account-group-outline"}
              size={usActive ? 30 : 24}
              color={usActive ? theme.colors.secondary : undefined}
            />}
            {showText && <ThemedText type={usActive ? "defaultSemiBold" : "default"}>
              Segítség
            </ThemedText>}
          </View>
        </TouchableRipple>
      </Measure>
        <TouchableRipple style={{ ...styles.button }} onPress={() => navigateTo("/me")}>
          <View style={{ alignItems: "center" }}>
            {showIcon && <Icon
              source={meActive ? "account" : "account-outline"}
              size={meActive ? 30 : 24}
              color={meActive ? theme.colors.secondary : undefined}
            />}
            {showText && <ThemedText type={meActive ? "defaultSemiBold" : "default"}>
              Én
            </ThemedText>}
          </View>
        </TouchableRipple>
      <Measure name="briefcase">
        <TouchableRipple style={{ ...styles.button }} onPress={() => navigateTo("/user",{uid})}>
          <View style={{ alignItems: "center" }}>
            {showIcon && <Icon
              source={profilActive ? "briefcase" : "briefcase-outline"}
              size={profilActive ? 30 : 24}
              color={profilActive ? theme.colors.secondary : undefined}
            />}
            {showText && <ThemedText type={profilActive ? "defaultSemiBold" : "default"}>
              Profilod
            </ThemedText>}
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
