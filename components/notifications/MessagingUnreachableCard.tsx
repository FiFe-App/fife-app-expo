import { useState } from "react";
import { View } from "react-native";
import { Icon, Surface } from "react-native-paper";
import { Button } from "@/components/Button";
import { ThemedText } from "@/components/ThemedText";
import { useAppTheme } from "@/assets/theme";
import { BorderRadius } from "@/constants/borderRadius";
import { Spacing } from "@/constants/spacing";

export const UNREACHABLE_TITLE = "Nem kapsz értesítést az üzenetekről";
export const UNREACHABLE_BODY =
  "A közvetlen üzenet be van kapcsolva a profilodban, de sem push, sem email értesítést nem kérsz — így nem tudod meg, ha valaki írt neked, és hiába vár a válaszodra.";
export const UNREACHABLE_ACTION = "Kérek értesítést";

interface FixProps {
  /** Turns a channel back on. Resolves false if the write failed. */
  onFix: () => Promise<boolean>;
}

/** Shared press handling: one in-flight fix at a time. */
const useFixHandler = ({ onFix }: FixProps) => {
  const [busy, setBusy] = useState(false);
  const fix = async () => {
    setBusy(true);
    try {
      await onFix();
    } finally {
      setBusy(false);
    }
  };
  return { busy, fix };
};

/**
 * Shown to someone who accepts direct messages but has no channel that can
 * deliver one. Unlike the opt-in prompts this cannot be dismissed: it is a
 * broken setting rather than a question, and it disappears the moment a channel
 * is switched on.
 */
export function MessagingUnreachableCard({ onFix }: FixProps) {
  const theme = useAppTheme();
  const { busy, fix } = useFixHandler({ onFix });

  return (
    <Surface
      elevation={1}
      style={{
        borderRadius: BorderRadius.lg,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        gap: Spacing.sm,
        backgroundColor: theme.colors.errorContainer,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.md }}>
        <Icon source="bell-off-outline" size={24} color={theme.colors.error} />
        <ThemedText style={{ flex: 1 }} type="defaultSemiBold">
          {UNREACHABLE_TITLE}
        </ThemedText>
      </View>
      <ThemedText type="label">{UNREACHABLE_BODY}</ThemedText>
      <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
        <Button mode="contained-tonal" onPress={fix} loading={busy} disabled={busy}>
          {UNREACHABLE_ACTION}
        </Button>
      </View>
    </Surface>
  );
}

/**
 * The same warning sized for a row of the contacts editor, where the switch it
 * refers to is already on screen and the long explanation would crowd it out.
 */
export function MessagingUnreachableNotice({ onFix }: FixProps) {
  const theme = useAppTheme();
  const { busy, fix } = useFixHandler({ onFix });

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
        paddingHorizontal: Spacing.sm,
      }}
    >
      <Icon source="bell-off-outline" size={16} color={theme.colors.error} />
      <ThemedText type="label" style={{ flex: 1, color: theme.colors.error }}>
        Nem kapsz értesítést, ha valaki ír neked.
      </ThemedText>
      <Button mode="text" compact onPress={fix} loading={busy} disabled={busy}>
        Bekapcsolom
      </Button>
    </View>
  );
}
