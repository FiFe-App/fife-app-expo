import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Icon } from "react-native-paper";

import { useAppTheme } from "@/assets/theme";
import { Button } from "@/components/Button";
import { Logo } from "@/components/Logo";
import { ThemedText } from "@/components/ThemedText";
import { Spacing } from "@/constants/spacing";

interface AppLockScreenProps {
  onUnlock: () => Promise<boolean>;
}

/**
 * Covers the whole app while the app-zár is locked. It sits on top of the
 * navigator instead of replacing it, so unlocking lands exactly where the user
 * left off. The OS prompt opens by itself; the button is for after "Mégse".
 */
export default function AppLockScreen({ onUnlock }: AppLockScreenProps) {
  const theme = useAppTheme();

  useEffect(() => {
    onUnlock();
  }, [onUnlock]);

  return (
    <View
      accessibilityViewIsModal
      style={[StyleSheet.absoluteFill, styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Logo style={styles.logo} />
      <Icon source="lock-outline" size={36} color={theme.colors.onBackground} />
      <ThemedText variant="headlineSmall" type="bold" style={{ textAlign: "center" }}>
        A FiFe zárolva van
      </ThemedText>
      <ThemedText variant="bodyMedium" style={{ textAlign: "center", color: theme.colors.onSurfaceVariant }}>
        Ujjlenyomattal, arccal vagy a telefonod PIN-kódjával oldhatod fel.
      </ThemedText>
      <Button mode="contained" icon="fingerprint" onPress={onUnlock} style={{ marginTop: Spacing.md }}>
        Feloldás
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 1000,
    elevation: 1000,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  logo: {
    width: 160,
    height: 60,
    marginBottom: Spacing.lg,
  },
});
