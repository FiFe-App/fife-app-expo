import { Href } from "expo-router";
import { Image } from "expo-image";
import { type ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Badge, Icon, TouchableRipple } from "react-native-paper";
import { useSelector } from "react-redux";
import { ThemedText } from "../ThemedText";
import { Logo } from "../Logo";
import ProfileImage from "../ProfileImage";
import ModeSwitch from "./ModeSwitch";
import { useAppNavigation } from "./useAppNavigation";
import { RootState } from "@/redux/store";
import { modeTokens, useAppTheme } from "@/assets/theme";
import { Spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/borderRadius";
import { emotionAvailable } from "@/constants/emotionTiming";

/** Width of the sidebar; the Én/Mi switch fills it minus the padding. */
export const SIDE_NAV_WIDTH = 264;
const SIDE_NAV_PADDING = Spacing.xl;
const ICON_SIZE = 24;

/**
 * The navigation of wide screens (see WIDE_BREAKPOINT): the same Én/Mi switch
 * and the same tabs as the bottom bar, stacked down the left edge. The switch
 * sits at the top, where a desktop user looks for "where am I" — the bottom
 * bar's raised dock only makes sense under a thumb.
 */
export default function SideNavigation() {
  const theme = useAppTheme();
  const { uid, name, userData, messagingEnabled } = useSelector((state: RootState) => state.user);
  const { mode, active, navigateTo, switchMode, totalUnread } = useAppNavigation();
  const accent = mode === "mi" ? theme.colors.tertiary : theme.colors.secondary;
  const activePillBg = modeTokens[mode][theme.dark ? "dark" : "light"].switchActive;
  const avatarUrl = userData?.avatar_url;

  const item = (
    label: string,
    path: Href,
    isActive: boolean,
    icon: string,
    iconOff: string,
    trailing?: ReactNode,
  ) => (
    <TouchableRipple
      key={label}
      borderless
      onPress={() => navigateTo(path)}
      accessibilityRole="link"
      accessibilityState={{ selected: isActive }}
      style={[styles.item, isActive && { backgroundColor: activePillBg }]}
    >
      <View style={styles.itemContent}>
        <Icon
          source={isActive ? icon : iconOff}
          size={ICON_SIZE}
          color={isActive ? accent : theme.colors.onSurfaceVariant}
        />
        <ThemedText
          numberOfLines={1}
          type={isActive ? "defaultSemiBold" : "default"}
          style={{ flex: 1, color: isActive ? accent : theme.colors.onSurface }}
        >
          {label}
        </ThemedText>
        {trailing}
      </View>
    </TouchableRipple>
  );

  const enItems = [
    item("Otthon", "/me", active.me, "home-variant", "home-variant-outline"),
    emotionAvailable &&
      item("Napló", "/user/emotion-history", active.naplo, "calendar-month", "calendar-month-outline"),
    item("Segítség", "/user/get-help", active.help, "lifebuoy", "lifebuoy"),
    item("Beállítások", "/beallitasok", active.settings, "cog", "cog-outline"),
  ];

  const miItems = [
    item("Környék", "/home", active.us, "map-marker-radius", "map-marker-radius-outline"),
    item("Keresés", "/search", active.search, "magnify", "magnify"),
    // Messaging is opt-in, so the entry point only exists once it's on.
    messagingEnabled &&
      item(
        "Üzenetek",
        "/chats",
        active.chat,
        "message",
        "message-outline",
        totalUnread > 0 ? (
          <Badge size={20} style={{ backgroundColor: theme.colors.error }}>
            {totalUnread}
          </Badge>
        ) : undefined,
      ),
    item("Profilod", "/user/edit", active.profil, "account-circle", "account-circle-outline"),
  ];

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.elevation.level1 }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Logo style={styles.logo} />
        <ModeSwitch
          mode={mode}
          onSwitch={switchMode}
          width={SIDE_NAV_WIDTH - 2 * SIDE_NAV_PADDING}
        />
        <View accessibilityRole="tablist" style={styles.items}>
          {mode === "en" ? enItems : miItems}
        </View>
      </ScrollView>
      <TouchableRipple
        borderless
        onPress={() => navigateTo("/user/edit")}
        accessibilityRole="link"
        accessibilityLabel="Profilod"
        style={styles.user}
      >
        <View style={styles.userContent}>
          {uid && avatarUrl ? (
            <ProfileImage uid={uid} avatar_url={avatarUrl} style={styles.avatar} />
          ) : (
            <Image source={require("@/assets/images/Slimey.png")} style={styles.avatar} />
          )}
          <View style={{ flex: 1, minWidth: 0 }}>
            <ThemedText type="defaultSemiBold" numberOfLines={1}>
              {name || "Profilod"}
            </ThemedText>
            <ThemedText
              numberOfLines={1}
              variant="labelMedium"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              Profil szerkesztése
            </ThemedText>
          </View>
        </View>
      </TouchableRipple>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: SIDE_NAV_WIDTH,
    alignSelf: "stretch",
  },
  content: {
    padding: SIDE_NAV_PADDING,
    gap: Spacing.xxl,
  },
  logo: {
    width: 110,
    height: 24,
    alignSelf: "flex-start",
  },
  items: {
    gap: Spacing.xs,
  },
  item: {
    height: 48,
    borderRadius: BorderRadius.xl,
    justifyContent: "center",
    paddingHorizontal: Spacing.md,
  },
  itemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  user: {
    margin: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
  },
  userContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
  },
});
