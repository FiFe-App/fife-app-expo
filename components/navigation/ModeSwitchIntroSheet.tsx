import AsyncStorage from "@react-native-async-storage/async-storage";
import { View } from "react-native";
import { Modal, Portal, ThemeProvider, useTheme } from "react-native-paper";
import Animated, { Easing, SlideInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getTheme, useAppTheme } from "@/assets/theme";
import { Button } from "@/components/Button";
import { ThemedText } from "@/components/ThemedText";
import { Spacing } from "@/constants/spacing";
import ModeCard from "./ModeCard";

/** Set once the user has confirmed their first switch over to Mi. Per device. */
export const MODE_SWITCH_INTRO_KEY = "modeSwitchIntroSeen";

export const readModeSwitchIntroSeen = async (): Promise<boolean> => {
  try {
    return (await AsyncStorage.getItem(MODE_SWITCH_INTRO_KEY)) === "1";
  } catch {
    // Unreadable storage: better to explain once more than never.
    return false;
  }
};

export const markModeSwitchIntroSeen = () =>
  AsyncStorage.setItem(MODE_SWITCH_INTRO_KEY, "1").catch(() => {});

interface ModeSwitchIntroSheetProps {
  visible: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}

/**
 * Shown the first time the user taps the Én / Mi switch towards Mi: a sheet
 * from the bottom that says what changes — from their private space to the
 * community, where other people are. Dismissing it keeps them on Én; it only
 * stops appearing once they have actually switched.
 */
export default function ModeSwitchIntroSheet({
  visible,
  onConfirm,
  onDismiss,
}: ModeSwitchIntroSheetProps) {
  const base = useTheme();
  // The sheet leads to the Mi side, so it already wears Mi's colours.
  const miTheme = getTheme(base.dark, "mi");

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        style={{ justifyContent: "flex-end", marginBottom: 0 }}
        contentContainerStyle={{ justifyContent: "flex-end" }}
      >
        <ThemeProvider theme={miTheme}>
          {visible && <SheetContent onConfirm={onConfirm} />}
        </ThemeProvider>
      </Modal>
    </Portal>
  );
}

function SheetContent({ onConfirm }: { onConfirm: () => void }) {
  const theme = useAppTheme();
  const { bottom } = useSafeAreaInsets();

  return (
    <Animated.View
      entering={SlideInDown.duration(320).easing(Easing.out(Easing.cubic))}
      accessibilityViewIsModal
      testID="mode-switch-intro"
      style={{
        width: "100%",
        maxWidth: 600,
        alignSelf: "center",
        backgroundColor: theme.colors.background,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.xl + bottom,
        gap: Spacing.lg,
      }}
    >
      <View
        aria-hidden
        style={{
          alignSelf: "center",
          width: 40,
          height: 5,
          borderRadius: 3,
          backgroundColor: theme.colors.outlineVariant,
        }}
      />

      <View style={{ gap: Spacing.xs }}>
        <ThemedText variant="headlineSmall" type="bold" accessibilityRole="header">
          Átváltasz a közösségre?
        </ThemedText>
        <ThemedText variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          A „mi” szekcióban más felhasználókkal találkozhatsz.
        </ThemedText>
      </View>

      <View style={{ gap: Spacing.sm }}>
        <ModeCard mode="en" />
        <ModeCard mode="mi" highlighted />
      </View>

      <ThemedText variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
        Bármikor visszaválthatsz az alsó kapcsolóval.
      </ThemedText>

      <Button mode="contained" type="tertiary" onPress={onConfirm}>
        Átváltok
      </Button>
    </Animated.View>
  );
}
