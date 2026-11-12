import { Href, router, usePathname, useSegments } from "expo-router";
import { Image } from "expo-image";
import { useRef, useCallback, useEffect, useState, type ReactNode } from "react";
import { InteractionManager, Platform, StyleSheet, View, useWindowDimensions, type LayoutChangeEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Badge, Icon, TouchableRipple } from "react-native-paper";
import { ThemedText } from "../ThemedText";
import { useSelector } from "react-redux";
import { Spacing } from "@/constants/spacing";
import { RootState } from "@/redux/store";
import { modeTokens, useAppTheme } from "@/assets/theme";
import Measure from "../tutorial/Measure";
import ProfileImage from "../ProfileImage";
import ModeSwitch from "./ModeSwitch";
import NavBarShape, { NAV_DOCK_RISE } from "./NavBarShape";
import { MODE_HOME, modeForPath, otherMode, type AppMode } from "@/lib/mode/appMode";
import { emotionAvailable } from "@/constants/emotionTiming";
import { BorderRadius } from "@/constants/borderRadius";

/**
 * Pre-render the other side's first screen while the app is idle, so the
 * Én/Mi switch only has to bring an already-built screen forward. Turn it off
 * if the speculative render ever costs more than it saves.
 */
const PREFETCH_OTHER_SIDE = true;
/** Safety net: a switch whose navigation never lands is undone after this. */
const SWITCH_TIMEOUT_MS = 10000;

const prefetched = new Set<string>();

const selectedSize = 28;
const normalSize = 28;
const textVariant = "labelSmall";

// Geometry of the floating bar (see the design reference): it keeps a gutter
// to the screen edges, never grows wider than a tablet-friendly maximum, and
// the Én/Mi dock sits centred above it, melted into the top edge.
const BAR_GUTTER = Spacing.md;
const BAR_MAX_WIDTH = 480;
const BAR_MIN_HEIGHT = 64;
const BAR_BOTTOM_GAP = 14;
const BAR_INNER_PADDING = 6;
const DOCK_TOP_INSET = 5;
const ACTIVE_PILL_WIDTH = 56;
const ACTIVE_PILL_HEIGHT = selectedSize + 4;

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
  // The side the route is on. It only changes once the new screen has been
  // rendered — which, on a heavy screen, can take a while.
  const routeMode = modeForPath(pathname);
  // A switch the user just asked for, remembered together with the route it
  // was asked on. The switch and the tabs follow it at once, and the (slow)
  // navigation starts after they have painted, so the control never waits for
  // the screen it is leading to.
  const [pending, setPending] = useState<{ target: AppMode; from: string } | null>(null);
  // It only counts while the route is still the one it was asked on. The
  // moment the route moves anywhere (the switch landed, a back gesture, a deep
  // link) the route is the source of truth again — also in the very render
  // where it moved, before any effect has had a chance to clean up.
  const pendingMode = pending && pending.from === pathname ? pending.target : null;
  const mode = pendingMode ?? routeMode;
  const switching = pendingMode !== null;

  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  useEffect(() => {
    setPending(null);
  }, [pathname]);

  // If the navigation never lands, don't stay on a side the route isn't on.
  // Tied to the pending switch itself, so it can't outlive or cut short a
  // newer one.
  useEffect(() => {
    if (!pending) return;
    const timer = setTimeout(() => setPending(null), SWITCH_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [pending]);

  // Warm up the other side while idle (see PREFETCH_OTHER_SIDE). Once per
  // side and session: after that it is already built.
  useEffect(() => {
    if (!PREFETCH_OTHER_SIDE) return;
    const href = MODE_HOME[otherMode(routeMode)];
    if (prefetched.has(href)) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const task = InteractionManager.runAfterInteractions(() => {
      timer = setTimeout(() => {
        prefetched.add(href);
        try {
          router.prefetch?.(href);
        } catch {
          // Best effort only: a failed warm-up just means a slower first switch.
        }
      }, 1000);
    });
    return () => {
      task.cancel();
      if (timer) clearTimeout(timer);
    };
  }, [routeMode]);

  const first = segment[0] ?? "";
  // While switching, the new side's first tab (where the switch lands) already
  // shows as selected and the old route's tabs are no longer lit.
  const meActive = switching ? pendingMode === "en" : pathname === "/me";
  const naploActive = !switching && pathname.startsWith("/user/emotion-history");
  const helpActive = !switching && pathname.startsWith("/user/get-help");
  const settingsActive = !switching && pathname.startsWith("/beallitasok");
  const usActive = switching
    ? pendingMode === "mi"
    : first.includes("home") || first.includes("fifeRadar") || first === "kerelmek";
  const searchActive = !switching && (first === "search" || pathname === "/biznisz");
  const chatActive = !switching && (first.includes("chat") || first === "group");
  // Én's own pages also live under /user, so only the Mi side's /user pages
  // light up the profile tab.
  const profilActive = !switching && first.includes("user") && mode === "mi";
  const lastNavTime = useRef(0);

  const navigateTo = useCallback((path: Href) => {
    const now = Date.now();
    if (now - lastNavTime.current < 300) return;
    // Skip if already on the exact same route
    if (pathname === path) return;

    lastNavTime.current = now;
    router.navigate(path);
  }, [pathname]);

  const switchMode = useCallback(() => {
    if (pendingMode) return;
    const from = pathnameRef.current;
    const target = otherMode(modeForPath(from));
    setPending({ target, from });
    // Navigate only after the switch has had a frame to paint, then a plain
    // timeout later so the render of the new screen can't hold that frame back.
    requestAnimationFrame(() =>
      setTimeout(() => {
        // The route moved on its own in the meantime: the request is stale.
        if (pathnameRef.current !== from) return;
        // Not routed through navigateTo: its 300 ms tap throttle would drop the
        // switch whenever a tab was tapped just before, leaving the control on
        // a side the route never goes to.
        lastNavTime.current = Date.now();
        try {
          router.navigate(MODE_HOME[target]);
        } catch {
          setPending(null);
        }
      }, 0),
    );
  }, [pendingMode]);

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);
  const accent = mode === "mi" ? theme.colors.tertiary : theme.colors.secondary;
  const activePillBg = modeTokens[mode][theme.dark ? "dark" : "light"].switchActive;

  // The bar's silhouette is drawn from its measured size, so it follows any
  // width (phones, tablets, web) and any font scale. Until the first layout it
  // starts from the window width, so there is no empty frame.
  const { width: windowWidth } = useWindowDimensions();
  const [barSize, setBarSize] = useState({
    width: Math.min(windowWidth - 2 * BAR_GUTTER, BAR_MAX_WIDTH),
    height: NAV_DOCK_RISE + BAR_MIN_HEIGHT,
  });
  const onBarLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBarSize((prev) =>
      Math.abs(prev.width - width) < 0.5 && Math.abs(prev.height - height) < 0.5
        ? prev
        : { width, height },
    );
  }, []);
  // The design floats the bar 14pt above the screen's bottom edge; where the
  // OS reserves more than that (Android navigation bar) the bar clears it.
  const bottomGap = Math.max(
    BAR_BOTTOM_GAP,
    Platform.OS === "ios" ? insets.bottom - 20 : insets.bottom,
  );

  const tab = (
    label: string,
    path: Href,
    active: boolean,
    icon: ReactNode,
  ) => (
    <TouchableRipple
      style={styles.button}
      // Clips the pressed highlight to the rounded shape; without it the
      // highlight is drawn as a plain rectangle over the tab.
      borderless
      onPress={() => navigateTo(path)}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
    >
      <View style={styles.tabContent}>
        <View style={[styles.iconPill, active && { backgroundColor: activePillBg, borderRadius:10000 }]}>
          <View style={{ height: selectedSize, justifyContent: "center" }}>{icon}</View>
        </View>
        <ThemedText
          variant={textVariant}
          numberOfLines={1}
          // Long labels ("Beállítások") shrink a little on narrow screens
          // instead of being cut off.
          adjustsFontSizeToFit
          minimumFontScale={0.75}
          type={active ? "defaultSemiBold" : "default"}
          style={{
            textAlign: "center",
            color: active ? accent : theme.colors.onSurfaceVariant,
          }}
        >
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
      {tab("Beállítások", "/beallitasok", settingsActive, iconFor(settingsActive, "cog", "cog-outline", normalSize - 2))}
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
    // The wrappers only exist to lay things out; they pass touches through so
    // the transparent corners beside the dock never block the screen below.
    <View pointerEvents="box-none" style={[styles.root, { paddingBottom: bottomGap }]}>
      <View pointerEvents="box-none" style={styles.frame} onLayout={onBarLayout}>
        <NavBarShape
          width={barSize.width}
          height={barSize.height}
          color={theme.colors.elevation.level1}
        />
        <View style={styles.bar}>
          <View style={styles.side}>{mode === "en" ? enLeft : miLeft}</View>
          <View style={styles.side}>{mode === "en" ? enRight : miRight}</View>
        </View>
        {/* Reaches above the bar: screens keep MODE_SWITCH_CLEARANCE
            (constants/layout.ts) free under their content because of it. */}
        <View pointerEvents="box-none" style={styles.dock}>
          <ModeSwitch mode={mode} onSwitch={switchMode} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Pulled up by the dock's rise so the bar itself, not the dock, is what the
  // screen above leaves room for.
  root: {
    marginTop: -NAV_DOCK_RISE,
    paddingHorizontal: BAR_GUTTER,
    alignItems: "center",
    zIndex: 1,
  },
  frame: {
    width: "100%",
    maxWidth: BAR_MAX_WIDTH,
    paddingTop: NAV_DOCK_RISE,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: BAR_MIN_HEIGHT,
    paddingHorizontal: BAR_INNER_PADDING,
    paddingVertical: Spacing.sm,
  },
  // Both halves are equally wide, so the dock above is always centred between
  // the two groups of tabs — whatever the number of tabs on either side.
  side: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
  },
  dock: {
    position: "absolute",
    top: DOCK_TOP_INSET,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  button: {
    flex: 1,
    maxWidth: 96,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  tabContent: {
    alignSelf: "stretch",
    alignItems: "center",
  },
  iconPill: {
    width: ACTIVE_PILL_WIDTH,
    maxWidth: "100%",
    height: ACTIVE_PILL_HEIGHT,
    borderRadius: BorderRadius.full,
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
