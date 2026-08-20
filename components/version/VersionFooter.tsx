import { View } from "react-native";
import { ActivityIndicator, Icon } from "react-native-paper";

import { Button } from "@/components/Button";
import { ThemedText } from "@/components/ThemedText";
import { useAppTheme } from "@/assets/theme";
import { Spacing } from "@/constants/spacing";
import { useAppVersionGate } from "@/hooks/useAppVersionGate";
import { canOpenUpdate, openUpdate } from "@/lib/appVersion/appVersionStatus";

/**
 * "Which version am I on, and is it current?" — the question a user asks
 * right before reporting a bug. Reuses the version gate, so what it says
 * here is the same answer that decides whether the app blocks.
 */
export default function VersionFooter() {
  const theme = useAppTheme();
  const { status, currentVersion, checking, recheck, updateAvailable } = useAppVersionGate();

  const behind = updateAvailable || status?.status === "blocked";
  const upToDate = status?.status === "ok";

  return (
    <View style={{ alignItems: "center", gap: Spacing.xs, paddingBottom: Spacing.xxl }}>
      <ThemedText type="label" style={{ opacity: 0.6 }}>
        {`FiFe App ${currentVersion ?? "— ismeretlen verzió"}`}
      </ThemedText>

      {behind && (
        <ThemedText type="label" style={{ color: theme.colors.primary }}>
          {`Új verzió elérhető: ${status?.latestVersion}`}
        </ThemedText>
      )}

      {upToDate && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.xs }}>
          <Icon source="check-circle-outline" size={16} color={theme.colors.primary} />
          <ThemedText type="label" style={{ opacity: 0.6 }}>
            Naprakész vagy
          </ThemedText>
        </View>
      )}

      {behind && canOpenUpdate(status) ? (
        <Button mode="text" compact icon="download" onPress={() => openUpdate(status)}>
          Frissítés
        </Button>
      ) : (
        <Button mode="text" compact onPress={recheck} disabled={checking}>
          {checking ? <ActivityIndicator size={14} /> : "Frissítések keresése"}
        </Button>
      )}
    </View>
  );
}
