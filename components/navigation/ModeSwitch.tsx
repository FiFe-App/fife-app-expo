import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Rect, Stop, SvgXml } from "react-native-svg";

import { useAppTheme } from "@/assets/theme";
import { BorderRadius } from "@/constants/borderRadius";
import type { AppMode } from "@/lib/mode/appMode";
import { ThemedText } from "../ThemedText";
import { enModeIcon, miModeIcon } from "./modeIcons";

interface ModeSwitchProps {
  mode: AppMode;
  onSwitch: () => void;
}

/** Size of the track; BottomNavigation sizes the dock around it. */
export const MODE_SWITCH_WIDTH = 130;
export const MODE_SWITCH_HEIGHT = 40;
const TRACK_PADDING = 3;
const HALF_WIDTH = (MODE_SWITCH_WIDTH - 2 * TRACK_PADDING) / 2;
const HALF_HEIGHT = MODE_SWITCH_HEIGHT - 2 * TRACK_PADDING;

/** How long the raised half takes to slide to the other side. */
export const MODE_SWITCH_DURATION = 260;

// Top / middle / bottom stops of the raised half, per side and theme.
const raisedStops = {
  en: {
    light: ["#FFFFFF", "#FDEBC8", "#F6DDAE"],
    dark: ["#5C5544", "#4D4738", "#403B2E"],
  },
  mi: {
    light: ["#FFFFFF", "#E4DCFF", "#D3C6F8"],
    dark: ["#473D7A", "#3A3166", "#2F2754"],
  },
} as const;

/** One gradient fill of the raised half; the two sides are cross-faded. */
function RaisedFill({ id, stops }: { id: string; stops: readonly string[] }) {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={stops[0]} />
          <Stop offset="0.5" stopColor={stops[1]} />
          <Stop offset="1" stopColor={stops[2]} />
        </LinearGradient>
      </Defs>
      {/* An explicit radius of half the height: "full" would be clamped per
          axis and turn the corners into ellipses. */}
      <Rect
        width="100%"
        height="100%"
        rx={HALF_HEIGHT / 2}
        ry={HALF_HEIGHT / 2}
        fill={`url(#${id})`}
      />
    </Svg>
  );
}

/**
 * The Én / Mi control in the dock of the bottom bar. One control, not two
 * buttons: tapping anywhere on it flips to the other side of the app. The
 * raised half is a single piece that slides (and changes colour) between the
 * two sides; the labels sit on top and only say where to tap.
 *
 * The slide runs on the UI thread, so it keeps moving smoothly even while the
 * JS thread is busy rendering the screen the switch leads to.
 */
export default function ModeSwitch({ mode, onSwitch }: ModeSwitchProps) {
  const theme = useAppTheme();
  const tone = theme.dark ? "dark" : "light";
  const trackBg = theme.dark ? "#1E1B16" : "#F5EEE2";
  const activeText = theme.dark ? "#FFFFFF" : "#1F1B16";
  // Each label wears the colour of its own side while it is not the active one.
  const inactiveText = (side: AppMode) =>
    side === "mi"
      ? theme.dark ? "#CFC4FF" : "#7D6FB8"
      : theme.dark ? "#FDEDC8" : "#7A5A2E";

  // 0 = Én, 1 = Mi. Follows `mode`, so it starts the moment the user taps
  // (BottomNavigation flips `mode` before the navigation begins).
  const progress = useSharedValue(mode === "mi" ? 1 : 0);
  useEffect(() => {
    progress.value = withTiming(mode === "mi" ? 1 : 0, {
      duration: MODE_SWITCH_DURATION,
      easing: Easing.out(Easing.cubic),
    });
  }, [mode, progress]);

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * HALF_WIDTH }],
  }));
  const enFillStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.value }));
  const miFillStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  const half = (side: AppMode, label: string) => {
    const active = side === mode;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        // Each half is its own button, so each needs its own label: the
        // inactive one switches, the active one only says where you are.
        accessibilityLabel={
          active
            ? side === "en" ? "Én mód (aktív)" : "Mi mód (aktív)"
            : side === "mi" ? "Váltás Mi módra (közösség)" : "Váltás Én módra (privát)"
        }
        testID={`mode-switch-${side}`}
        onPress={() => {
          if (!active) onSwitch();
        }}
        // No system highlight here: the platform's pressed overlay is a plain
        // rectangle that ignores the pill's rounded shape. A light fade of the
        // content says "pressed" instead.
        style={({ pressed }) => [styles.half, !active && pressed && styles.pressed]}
      >
        <View style={styles.halfContent}>
          <SvgXml
            xml={side === "en" ? enModeIcon : miModeIcon}
            height={24}
            width={side === "en" ? 24 : 30}
          />
          <ThemedText
            type="bold"
            numberOfLines={1}
            style={{
              color: active ? activeText : inactiveText(side),
              fontSize: 13,
              lineHeight: 16,
            }}
          >
            {label}
          </ThemedText>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.track, { backgroundColor: trackBg }]}>
      {/* Behind the labels: the raised half, carrying its own shadow. */}
      <Animated.View pointerEvents="none" style={[styles.raised, slideStyle]}>
        <Animated.View style={[StyleSheet.absoluteFill, enFillStyle]}>
          <RaisedFill id="modeSwitchRaisedEn" stops={raisedStops.en[tone]} />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, miFillStyle]}>
          <RaisedFill id="modeSwitchRaisedMi" stops={raisedStops.mi[tone]} />
        </Animated.View>
      </Animated.View>
      {half("en", "Én")}
      {half("mi", "Mi")}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: MODE_SWITCH_WIDTH,
    height: MODE_SWITCH_HEIGHT,
    borderRadius: BorderRadius.full,
    padding: TRACK_PADDING,
    flexDirection: "row",
  },
  raised: {
    position: "absolute",
    top: TRACK_PADDING,
    left: TRACK_PADDING,
    width: HALF_WIDTH,
    height: HALF_HEIGHT,
    borderRadius: BorderRadius.full,
    // The raised half casts a soft shadow onto the track, like the reference.
    boxShadow: [
      { offsetX: 0, offsetY: 2, blurRadius: 6, color: "rgba(33, 28, 22, 0.18)" },
    ],
  },
  half: {
    flex: 1,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.6,
  },
  halfContent: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 2,
  },
});
