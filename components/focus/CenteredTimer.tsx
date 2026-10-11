import { ReactNode, useEffect, useState } from "react";
import { View } from "react-native";
import Smiley from "@/components/Smiley";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Spacing } from "@/constants/spacing";

/** The current time, re-rendering every second while `active`. */
export function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    setNow(Date.now());
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

/**
 * The whole screen of both Fókusz and Szünet: a timer, the smiley under it,
 * and the single control below — nothing else.
 */
export default function CenteredTimer({ time, children }: { time: string; children?: ReactNode }) {
  return (
    <ThemedView
      type="default"
      style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: Spacing.xl, padding: Spacing.lg }}
    >
      <ThemedText type="title" style={{ fontVariant: ["tabular-nums"] }} accessibilityRole="timer">
        {time}
      </ThemedText>
      <Smiley style={{ width: 100, height: 100 }} />
      <View style={{ minHeight: 48, flexDirection: "row", gap: Spacing.sm, alignItems: "center" }}>
        {children}
      </View>
    </ThemedView>
  );
}
