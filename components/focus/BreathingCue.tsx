import { useEffect, useState } from "react";
import { Animated, View } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { BREATH_IN_MS, BREATH_OUT_MS } from "./BreathingHalo";

const FADE_MS = 600;
export const BREATH_IN_TEXT = "Lélegezz be…";
export const BREATH_OUT_TEXT = "és ki…";

/**
 * "Lélegezz be…" for 4 s, "és ki…" for 6 s, in step with BreathingHalo. With
 * `visibleForMs` it fades away after that long, once the rhythm is found, and
 * leaves the circle to breathe on its own; its line stays reserved so nothing
 * on the screen moves.
 */
export default function BreathingCue({ color, delayMs = 0, visibleForMs }: {
  color: string;
  delayMs?: number;
  visibleForMs?: number;
}) {
  const [inhale, setInhale] = useState(true);
  const [gone, setGone] = useState(false);
  const opacity = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    if (visibleForMs === undefined) return;
    const timer = setTimeout(() => setGone(true), visibleForMs);
    return () => clearTimeout(timer);
  }, [visibleForMs]);

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

  if (gone) return <View style={{ height: 28 }} />;

  return (
    <Animated.View style={{ opacity }} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <ThemedText style={{ color, fontSize: 21, lineHeight: 28, fontFamily: "RedHatText-Medium", textAlign: "center" }}>
        {inhale ? BREATH_IN_TEXT : BREATH_OUT_TEXT}
      </ThemedText>
    </Animated.View>
  );
}
