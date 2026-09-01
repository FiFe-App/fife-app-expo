import { Route, router, usePathname, useSegments } from "expo-router";
import { Image } from "expo-image";
import { useRef, useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { Badge, Icon, TouchableRipple } from "react-native-paper";
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
  const { uid, userData, messagingEnabled } = useSelector((state: RootState) => state.user);
  const unreadCounts = useSelector((state: RootState) => state.chat.unreadCounts);
  const avatarUrl = userData?.avatar_url;

  const profilActive = segment[0]?.includes("user");
  const meActive = segment[0] === "me";
  const usActive = segment[0]?.includes("home") || segment[0]?.includes("fifeRadar") || segment[0]?.includes("search");
  const chatActive = segment[0]?.includes("chat");
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

  const selectedSize = 28;
  const normalSize = 28;
  const textVariant = "labelMedium";

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  return (
    <ThemedView type="card" style={{ flexDirection: "row", backgroundColor: theme.colors.elevation.level1, zIndex:1, padding: Spacing.sm }}>
      {/* Messaging is opt-in, so the entry point only exists once it's on. */}
      {messagingEnabled && (
        <TouchableRipple style={{ ...styles.button }} onPress={() => navigateTo("/chats")}>
          <View style={{ alignItems: "center" }}>
            {showIcon && (
              <View style={{height:selectedSize}}>
                <Icon
                  source={chatActive ? "message" : "message-outline"}
                  size={chatActive ? selectedSize-4 : normalSize-4}
                  color={chatActive ? theme.colors.primary : undefined}
                />
                {totalUnread > 0 && (
                  // The badge sits on top of the icon, so it must not swallow the tap.
                  <View pointerEvents="none" style={{ position: "absolute", top: -2, right: -6 }}>
                    <Badge size={16} style={{ backgroundColor: theme.colors.error }}>
                      {totalUnread}
                    </Badge>
                  </View>
                )}
              </View>
            )}
            {showText && <ThemedText variant={textVariant} numberOfLines={1} type={chatActive ? "defaultSemiBold" : "default"}>
              Üzenetek
            </ThemedText>}
          </View>
        </TouchableRipple>
      )}
      <Measure name="home">
        <TouchableRipple style={{ ...styles.button, }} onPress={() => navigateTo("/home")}>
          <View style={{ alignItems: "center" }}>
            {showIcon && <Icon
              source={usActive ? "account-group" : "account-group-outline"}
              size={usActive ? selectedSize : normalSize}
              color={usActive ? theme.colors.tertiary : theme.colors.tertiary}
            />}
            {showText && <ThemedText variant={textVariant} numberOfLines={1} type={usActive ? "defaultSemiBold" : "default"}>
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
            {showText && <ThemedText variant={textVariant} numberOfLines={1} type={meActive ? "defaultSemiBold" : "default"}>
              Otthon
            </ThemedText>}
          </View>
        </TouchableRipple>
      <Measure name="briefcase">
        <TouchableRipple style={{ ...styles.button }} onPress={() => navigateTo("/user/edit")}>
          <View style={{ alignItems: "center" }}>
              {showIcon && (
                // The box stays exactly icon-sized in every state and the
                // selection ring is drawn on top of it, so selecting this tab
                // can't make the whole bar taller than the other icons.
                <View
                  style={[{
                    borderWidth:2,
                    borderRadius: 5, 
                    padding: 2,
                    borderColor: profilActive ? theme.colors.primary : "transparent"
                  }]}
                >
                  {uid && avatarUrl ? (
                    <ProfileImage
                      uid={uid}
                      avatar_url={avatarUrl}
                      style={{
                    borderRadius: 2,
                    width: normalSize-4,
                    height: normalSize-4,}}
                    />
                  ) : (
                    <Image
                      source={require("@/assets/images/Slimey.png")}
                      style={{
                    borderRadius: 2,
                    width: normalSize-4,
                    height: normalSize-4,}}
                    />
                  )}
                </View>
              )}
            {showText && <ThemedText variant={textVariant} numberOfLines={1} type={profilActive ? "defaultSemiBold" : "default"}>
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
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 4,
  },
  selectionRing: {
    borderWidth: 2,
  },
});

export default BottomNavigation;
