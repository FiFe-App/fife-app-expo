import { View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { Spacing } from "@/constants/spacing";
import { useAppVersionGate } from "@/hooks/useAppVersionGate";

/**
 * "Which version am I on, and is it current?" — the question a user asks
 * right before reporting a bug. Reuses the version gate, so what it says
 * here is the same answer that decides whether the app blocks.
 */
export default function VersionFooter() {
  const { currentVersion } = useAppVersionGate();

  return (
    <View style={{ alignItems: "center", gap: Spacing.xs, paddingBottom: Spacing.xxl }}>
      <ThemedText type="label" style={{ opacity: 0.6 }}>
        {`FiFe App ${currentVersion ?? "— ismeretlen verzió"}`}
      </ThemedText>
    </View>
  );
}
