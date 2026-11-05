import { Href, router, usePathname, useSegments } from "expo-router";
import { Image } from "expo-image";
import { useRef, useCallback, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Badge, Icon, TouchableRipple } from "react-native-paper";
import { ThemedText } from "../ThemedText";
import { useSelector } from "react-redux";
import { Spacing } from "@/constants/spacing";
import { RootState } from "@/redux/store";
import { useAppTheme } from "@/assets/theme";
import Measure from "../tutorial/Measure";
import { ThemedView } from "../ThemedView";
import ProfileImage from "../ProfileImage";
import ModeSwitch from "./ModeSwitch";
import { MODE_HOME, modeForPath, otherMode } from "@/lib/mode/appMode";
import { emotionAvailable } from "@/constants/emotionTiming";
import { BorderRadius } from "@/constants/borderRadius";

const selectedSize = 28;
const normalSize = 28;
const textVariant = "labelMedium";

/**
 * The bottom bar of both sides of the app. The Én/Mi switch sits in the
 * middle; the tabs around it belong to whichever side the current route is on
 * (see lib/mode/appMode.ts) — Én: Otthon, Napló, Segítség, Beállítások;
 * Mi: Környékem, Keresés, Üzenetek, Profilod.
 */
const BottomNavigation = () => {
  const segment = useSegments();
  const pathname = usePathname();
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { uid, userData, messagingEnabled } = useSelector((state: RootState) => state.user);
  const unreadCounts = useSelector((state: RootState) => state.chat.unreadCounts);
  const avatarUrl = userData?.avatar_url;
  const mode = modeForPath(pathname);

  const first = segment[0] ?? "";
  const meActive = pathname === "/me";
  const naploActive = pathname.startsWith("/user/emotion-history");
  const helpActive = pathname.startsWith("/user/get-help");
  const usActive = first.includes("home") || first.includes("fifeRadar");
  const searchActive = first === "search" || pathname === "/biznisz";
  const chatActive = first.includes("chat") || first === "group";
  // Én's own pages also live under /user, so only the Mi side's /user pages
  // light up the profile tab.
  const profilActive = first.includes("user") && mode === "mi";
  const lastNavTime = useRef(0);

  const navigateTo = useCallback((path: Href) => {
    const now = Date.now();
    if (now - lastNavTime.current < 300) return;
    // Skip if already on the exact same route
    if (pathname === path) return;

    lastNavTime.current = now;
    router.navigate(path);
  }, [pathname]);

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);
  const accent = mode === "mi" ? theme.colors.tertiary : theme.colors.secondary;

  const tab = (
    label: string,
    path: Href,
    active: boolean,
    icon: ReactNode,
  ) => (
    <TouchableRipple
      style={styles.button}
      onPress={() => navigateTo(path)}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
    >
      <View style={{ alignItems: "center" }}>
        <View style={{ height: selectedSize, justifyContent: "center" }}>{icon}</View>
        <ThemedText variant={textVariant} numberOfLines={1} type={active ? "defaultSemiBold" : "default"}>
          {label}
        </ThemedText>
      </View>
    </TouchableRipple>
  );

  const iconFor = (active: boolean, on: string, off: string, size = normalSize) => (
    <Icon
      source={active ? on : off}
      size={size}
      color={active ? accent : undefined}
    />
  );

  const enLeft = (
    <>
      {tab("Otthon", "/me", meActive, iconFor(meActive, "home-variant", "home-variant-outline"))}
      {emotionAvailable &&
        tab("Napló", "/user/emotion-history", naploActive, iconFor(naploActive, "calendar-month", "calendar-month-outline", normalSize - 2))}
    </>
  );
  const enRight = (
    <>
      {tab("Segítség", "/user/get-help", helpActive, iconFor(helpActive, "lifebuoy", "lifebuoy", normalSize - 2))}
      {/* The settings live on the profile page, a Mi route: once there the
          bar shows the Mi side, so this tab is never the active one. */}
      {tab("Beállítások", "/user/edit?tab=beallitasok", false, iconFor(false, "cog", "cog-outline", normalSize - 2))}
    </>
  );

  const miLeft = (
    <>
      <Measure name="home">
        {tab("Környék", "/home", usActive, iconFor(usActive, "map-marker-radius", "map-marker-radius-outline"))}
      </Measure>
      {tab("Keresés", "/search", searchActive, iconFor(searchActive, "magnify", "magnify", normalSize - 2))}
    </>
  );
  const miRight = (
    <>
      {/* Messaging is opt-in, so the entry point only exists once it's on. */}
      {messagingEnabled && tab(
        "Üzenetek",
        "/chats",
        chatActive,
        <View>
          {iconFor(chatActive, "message", "message-outline", selectedSize - 4)}
          {totalUnread > 0 && (
            // The badge sits on top of the icon, so it must not swallow the tap.
            <View pointerEvents="none" style={{ position: "absolute", top: -2, right: -6 }}>
              <Badge size={16} style={{ backgroundColor: theme.colors.error }}>
                {totalUnread}
              </Badge>
            </View>
          )}
        </View>,
      )}
      <Measure name="briefcase">
        {tab(
          "Profilod",
          "/user/edit",
          profilActive,
          // The box stays exactly icon-sized in every state and the
          // selection ring is drawn on top of it, so selecting this tab
          // can't make the whole bar taller than the other icons.
          <View
            style={{
              borderWidth: 2,
              borderRadius: 5,
              padding: 2,
              borderColor: profilActive ? accent : "transparent",
            }}
          >
            {uid && avatarUrl ? (
              <ProfileImage uid={uid} avatar_url={avatarUrl} style={styles.avatar} />
            ) : (
              <Image source={require("@/assets/images/Slimey.png")} style={styles.avatar} />
            )}
          </View>,
        )}
      </Measure>
    </>
  );

  return (
    <ThemedView
      type="card"
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: theme.colors.elevation.level1,
        zIndex: 1,
        paddingBottom: insets.bottom,
        paddingHorizontal: Spacing.xs,
      }}
    >
      <View style={styles.side}>{mode === "en" ? enLeft : miLeft}</View>
      <View style={styles.center}>
        <ModeSwitch mode={mode} onSwitch={() => navigateTo(MODE_HOME[otherMode(mode)])} />
      </View>
      <View style={styles.side}>{mode === "en" ? enRight : miRight}</View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  side: {
    flex: 1,
    flexDirection: "row",
  },
  center: {
    paddingHorizontal: Spacing.xs,
    justifyContent: "center",
  },
  button: {
    flex: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    borderRadius: 2,
    width: normalSize - 4,
    height: normalSize - 4,
  },
});

export default BottomNavigation;
