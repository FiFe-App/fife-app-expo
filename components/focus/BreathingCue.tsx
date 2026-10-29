import { useEffect, useState } from "react";
import { Animated } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { BREATH_IN_MS, BREATH_OUT_MS } from "./BreathingHalo";

const FADE_MS = 600;
export const BREATH_IN_TEXT = "Lélegezz be…";
export const BREATH_OUT_TEXT = "és ki…";

/** "Lélegezz be…" for 4 s, "és ki…" for 6 s, in step with BreathingHalo. */
export default function BreathingCue({ color, delayMs = 0 }: { color: string; delayMs?: number }) {
  const [inhale, setInhale] = useState(true);
  const opacity = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const step = (nextInhale: boolean, after: number) => {
      timer = setTimeout(() => {
        setInhale(nextInhale);
        step(!nextInhale, nextInhale ? BREATH_IN_MS : BREATH_OUT_MS);
      }, after);
    };
    // The halo opens first, then starts breathing in.
    step(false, delayMs + BREATH_IN_MS);
    return () => clearTimeout(timer);
  }, [delayMs]);

  useEffect(() => {
    opacity.setValue(0);
    const anim = Animated.timing(opacity, { toValue: 1, duration: FADE_MS, useNativeDriver: true });
    anim.start();
    return () => anim.stop();
  }, [inhale, opacity]);

  return (
    <Animated.View style={{ opacity }} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <ThemedText style={{ color, fontSize: 21, lineHeight: 28, fontFamily: "RedHatText-Medium", textAlign: "center" }}>
        {inhale ? BREATH_IN_TEXT : BREATH_OUT_TEXT}
      </ThemedText>
    </Animated.View>
  );
}
