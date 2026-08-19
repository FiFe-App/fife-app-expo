import { Platform, View } from "react-native";
import { Icon } from "react-native-paper";

import { Button } from "@/components/Button";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Spacing } from "@/constants/spacing";
import {
  AppVersionStatus,
  canOpenUpdate,
  openUpdate,
} from "@/lib/appVersion/appVersionStatus";

interface UpdateRequiredScreenProps {
  status: AppVersionStatus | null;
  currentVersion: string | null;
  checking?: boolean;
  onRetry: () => void;
}

/**
 * Shown instead of the app when this build is below `min_version`. There is
 * deliberately no way past it: the point of blocking a release is that its
 * screens are no longer safe to use against the current backend.
 */
export default function UpdateRequiredScreen({
  status,
  currentVersion,
  checking,
  onRetry,
}: UpdateRequiredScreenProps) {
  const isWeb = Platform.OS === "web";

  return (
    <ThemedView
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: Spacing.xxl,
        padding: Spacing.xxl,
      }}
    >
      <Icon source="cellphone-arrow-down" size={96} />
      <ThemedText type="title" style={{ textAlign: "center" }}>
        Frissítsd az appot!
      </ThemedText>
      <ThemedText style={{ textAlign: "center" }}>
        {status?.message ||
          "Ez a verzió már nem használható. Telepítsd a legújabb verziót, és folytathatod ott, ahol abbahagytad."}
      </ThemedText>
      <View style={{ gap: Spacing.sm, alignSelf: "stretch", alignItems: "center" }}>
        {canOpenUpdate(status) && (
          <Button mode="contained" icon="download" onPress={() => openUpdate(status)}>
            {isWeb ? "Újratöltés" : "Frissítés"}
          </Button>
        )}
        <Button mode="text" onPress={onRetry} loading={checking} disabled={checking}>
          Már frissítettem
        </Button>
      </View>
      <ThemedText type="label" style={{ textAlign: "center", opacity: 0.6 }}>
        {`Jelenlegi verzió: ${currentVersion ?? "ismeretlen"}${
          status?.latestVersion ? ` · legújabb: ${status.latestVersion}` : ""
        }`}
      </ThemedText>
    </ThemedView>
  );
}
