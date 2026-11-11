import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Icon, IconButton } from "react-native-paper";

import { useAppTheme } from "@/assets/theme";
import { Button } from "@/components/Button";
import { Logo } from "@/components/Logo";
import { ThemedText } from "@/components/ThemedText";
import { Spacing } from "@/constants/spacing";
import BottomNavigation from "./navigation/BottomNavigation";
import { MyAppbar } from "./MyAppBar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface AppLockScreenProps {
  onUnlock: () => Promise<boolean>;
  /** Leaves Én for Mi, which is not locked. */
  onLeave?: () => void;
}

/**
 * Covers the whole app while the app-zár is locked and Én mód is on screen. It sits on top of the
 * navigator instead of replacing it, so unlocking lands exactly where the user
 * left off. The OS prompt opens by itself; the button is for after "Mégse".
 */
export default function AppLockScreen({ onUnlock, onLeave }: AppLockScreenProps) {
  const theme = useAppTheme();
  const { top } = useSafeAreaInsets();

  useEffect(() => {
    onUnlock();
  }, [onUnlock]);

  return (
    <View
      accessibilityViewIsModal
      style={[StyleSheet.absoluteFill, styles.container, { backgroundColor: theme.colors.background }]}
    >

      {onLeave && (
        <IconButton
        style={{position:"absolute",left:10,top:top}} size={36}
        mode="contained-tonal" icon="chevron-left" onPress={onLeave} />
      )}
      <Icon source="lock-outline" size={84} color={theme.colors.onBackground} />
      <ThemedText variant="headlineSmall" type="bold" style={{ textAlign: "center" }}>
        Az Én mód zárolva van
      </ThemedText>
      <ThemedText variant="bodyMedium" style={{ textAlign: "center", color: theme.colors.onSurfaceVariant }}>
        A Mi mód zár nélkül is használható.
      </ThemedText>
      <Button mode="contained" icon="lock-open" onPress={onUnlock} style={{ marginTop: Spacing.md }}>
        Feloldás
      </Button>
      {onLeave && (
        <Button mode="text" icon="account-group-outline" onPress={onLeave}>
          Vissza a Mi módba
        </Button>
      )}
      <View style={{position:"absolute",width:"100%",bottom:0}}>
        <BottomNavigation />
      </View>
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
  },
  logo: {
    width: 160,
    height: 60,
    marginBottom: Spacing.lg,
  },
});
