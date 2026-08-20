import { Platform, View } from "react-native";
import { Icon, Surface } from "react-native-paper";

import { Button } from "@/components/Button";
import { ThemedText } from "@/components/ThemedText";
import { useAppTheme } from "@/assets/theme";
import { BorderRadius } from "@/constants/borderRadius";
import { Spacing } from "@/constants/spacing";
import {
  AppVersionStatus,
  canOpenUpdate,
  openUpdate,
} from "@/lib/appVersion/appVersionStatus";

interface UpdateAvailableCardProps {
  status: AppVersionStatus;
  onDismiss: () => void;
}

/**
 * The soft half of the version gate: a newer release is out, but this one
 * still works. Dismissing it hides the card until the *next* release, so the
 * same nudge never nags twice.
 */
export default function UpdateAvailableCard({
  status,
  onDismiss,
}: UpdateAvailableCardProps) {
  const theme = useAppTheme();

  return (
    <Surface
      elevation={2}
      style={{
        position:"absolute",
        bottom:80,
        margin: Spacing.sm,
        borderRadius: BorderRadius.lg,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        gap: Spacing.sm,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.md }}>
        <Icon source="download" size={24} color={theme.colors.primary} />
        <ThemedText style={{ flex: 1 }} type="defaultSemiBold">
          Új verzió érhető el
        </ThemedText>
      </View>
      <ThemedText type="label">
        {status.message ||
          `Letölthető egy új verzió (${status.latestVersion}). Ha szeretnéd megkapni a legújabb funkciókat és javításokat, töltsd le!`}
      </ThemedText>
      <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: Spacing.xs }}>
        <Button mode="text" onPress={onDismiss}>
          Most nem
        </Button>
        {canOpenUpdate(status) && (
          <Button mode="contained-tonal" onPress={() => openUpdate(status)}>
            {Platform.OS === "web" ? "Újratöltés" : "Frissítek"}
          </Button>
        )}
      </View>
    </Surface>
  );
}
