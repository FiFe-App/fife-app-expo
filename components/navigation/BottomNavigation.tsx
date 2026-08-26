import { Route, router, usePathname, useSegments } from "expo-router";
import { Image } from "expo-image";
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
import { BorderRadius } from "@/constants/borderRadius";
import ProfileImage from "../ProfileImage";

const BottomNavigation = () => {
  const segment = useSegments();
  const pathname = usePathname();
  const theme = useAppTheme();
  const { uid, userData } = useSelector((state: RootState) => state.user);
  const avatarUrl = userData?.avatar_url;

  const profilActive = segment[0]?.includes("user");
  const meActive = segment[0] === "me";
  const usActive = segment[0]?.includes("home") || segment[0]?.includes("fifeRadar");
  const lastNavTime = useRef(0);

  const navigateTo = useCallback((path: Route) => {
    const now = Date.now();
    if (now - lastNavTime.current < 300) return;
    // Skip if already on the exact same route
    if (pathname === path) return;

    lastNavTime.current = now;
    router.navigate(path);
  }, [pathname]);

  const showIcon = true;
  const showText = true;

  const selectedSize = 30;
  const normalSize = 30;

  return (
    <ThemedView type="card" style={{ flexDirection: "row", backgroundColor: theme.colors.elevation.level1, zIndex:1 }}>
      <Measure name="home">
        <TouchableRipple style={{ ...styles.button, }} onPress={() => navigateTo("/home")}>
          <View style={{ alignItems: "center" }}>
            {showIcon && <Icon
              source={usActive ? "account-group" : "account-group-outline"}
              size={usActive ? selectedSize : normalSize}
              color={usActive ? theme.colors.tertiary : theme.colors.tertiary}
            />}
            {showText && <ThemedText type={usActive ? "defaultSemiBold" : "default"}>
              Közösség
            </ThemedText>}
          </View>
        </TouchableRipple>
      </Measure>
        <TouchableRipple style={{ ...styles.button }} onPress={() => navigateTo("/me")}>
          <View style={{ alignItems: "center" }}>
            {showIcon && <Icon
              source={meActive ? "home" : "home-outline"}
              size={meActive ? selectedSize : normalSize}
              color={meActive ? theme.colors.secondary : undefined}
            />}
            {showText && <ThemedText type={meActive ? "defaultSemiBold" : "default"}>
              Otthon
            </ThemedText>}
          </View>
        </TouchableRipple>
      <Measure name="briefcase">
        <TouchableRipple style={{ ...styles.button }} onPress={() => navigateTo("/user/edit")}>
          <View style={{ alignItems: "center" }}>
              {showIcon && (
                <View
                  style={{
                    width: profilActive ? selectedSize + 2 : normalSize,
                    height: profilActive ? selectedSize + 2 : normalSize,
                    borderRadius: BorderRadius.sm,
                    overflow: "hidden",
                    padding: 1,
                    borderWidth: profilActive ? 2 : 0,
                    borderColor: theme.colors.primary,
                  }}
                >
                  {uid && avatarUrl ? (
                    <ProfileImage
                      uid={uid}
                      avatar_url={avatarUrl}
                      style={{
                        width: profilActive ? selectedSize - 4 : normalSize - 2,
                        height: profilActive ? selectedSize - 4 : normalSize - 2,
                        borderRadius: 4,
                      }}
                    />
                  ) : (
                    <Image
                      source={require("@/assets/images/Slimey.png")}
                      style={{
                        width: profilActive ? selectedSize - 4 : normalSize - 2,
                        height: profilActive ? selectedSize - 4 : normalSize - 2,
                        borderRadius: 4,
                      }}
                    />
                  )}
                </View>
              )}
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
  we: {
    

  }
});

export default BottomNavigation;
