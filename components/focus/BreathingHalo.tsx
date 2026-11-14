import { useEffect, useState } from "react";
import { AccessibilityInfo, Animated, Easing, View } from "react-native";

export const BREATH_IN_MS = 4000;
export const BREATH_OUT_MS = 6000;
/** The outer glow follows the circle a beat late, so the light "spills out". */
const GLOW_DELAY_MS = 300;
const OPEN_MS = 800;

const ease = Easing.inOut(Easing.sin);

/** Reduce-motion setting of the device; animations stay still while it is on. */
export function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce).catch(() => {});
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduce);
    return () => sub?.remove();
  }, []);
  return reduce;
}

function breathe(value: Animated.Value, delay: number) {
  return Animated.sequence([
    Animated.delay(delay),
    Animated.loop(
      Animated.sequence([
        Animated.timing(value, { toValue: 1, duration: BREATH_IN_MS, easing: ease, useNativeDriver: true }),
        Animated.timing(value, { toValue: 0, duration: BREATH_OUT_MS, easing: ease, useNativeDriver: true }),
      ]),
    ),
  ]);
}

/**
 * A light blue circle behind the image that grows for 4 s and shrinks for
 * 6 s, with a fainter glow around it. It opens gently rather than starting
 * at full size.
 */
export default function BreathingHalo({ color, dark }: { color: string; dark: boolean }) {
  const reduceMotion = useReduceMotion();
  const breath = useState(() => new Animated.Value(0))[0];
  const glow = useState(() => new Animated.Value(0))[0];
  const open = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    const opening = Animated.timing(open, { toValue: 1, duration: OPEN_MS, easing: ease, useNativeDriver: true });
    if (reduceMotion) {
      opening.start();
      return () => opening.stop();
    }
    const anim = Animated.sequence([opening, Animated.parallel([breathe(breath, 0), breathe(glow, GLOW_DELAY_MS)])]);
    anim.start();
    return () => anim.stop();
  }, [reduceMotion, breath, glow, open]);

  const [lo, hi] = dark ? [0.25, 0.5] : [0.35, 0.6];
  const circle = {
    opacity: Animated.multiply(open, breath.interpolate({ inputRange: [0, 1], outputRange: [lo, hi] })),
    transform: [{
      scale: reduceMotion
        ? 0.95
        : Animated.multiply(
          open.interpolate({ inputRange: [0, 1], outputRange: [0.66, 1] }),
          breath.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1.15] }),
        ),
    }],
  };
  const halo = {
    opacity: Animated.multiply(open, glow.interpolate({ inputRange: [0, 1], outputRange: dark ? [0.1, 0.2] : [0.12, 0.25] })),
    transform: [{ scale: reduceMotion ? 1 : glow.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.25] }) }],
  };

  return (
    <View pointerEvents="none" style={{ position: "absolute", width: 260, height: 260, alignItems: "center", justifyContent: "center" }}>
      <Animated.View style={[{ position: "absolute", width: 260, height: 260, borderRadius: 130, backgroundColor: color }, halo]} />
      <Animated.View style={[{ position: "absolute", width: 220, height: 220, borderRadius: 110, backgroundColor: color }, circle]} />
    </View>
  );
}
