import { StyleSheet, View } from "react-native";
import { TouchableRipple } from "react-native-paper";

import { modeTokens, useAppTheme } from "@/assets/theme";
import { BorderRadius } from "@/constants/borderRadius";
import type { AppMode } from "@/lib/mode/appMode";
import { ThemedText } from "../ThemedText";

interface ModeSwitchProps {
  mode: AppMode;
  onSwitch: () => void;
}

/**
 * The Én / Mi pill in the middle of the bottom bar. One control, not two
 * buttons: tapping anywhere on it flips to the other side of the app, and the
 * highlighted half always tells which side the user is on now.
 */
export default function ModeSwitch({ mode, onSwitch }: ModeSwitchProps) {
  const theme = useAppTheme();
  const tone = theme.dark ? "dark" : "light";
  const activeBg = modeTokens[mode][tone].switchActive;
  // The pill itself is dark on both themes; the halves carry the colour.
  const pillBg = theme.dark ? "#000000" : "#1F1B16";
  const inactiveText = mode === "en" ? "#CFC4FF" : "#FDEDC8";
  const activeText = theme.dark ? "#FFFFFF" : "#1F1B16";

  const half = (side: AppMode, label: string) => {
    const active = side === mode;
    return (
      <View style={[styles.half, active && { backgroundColor: activeBg }]}>
        <ThemedText
          type="bold"
          style={{ color: active ? activeText : inactiveText, fontSize: 15 }}
        >
          {label}
        </ThemedText>
      </View>
    );
  };

  return (
    <TouchableRipple
      onPress={onSwitch}
      accessibilityRole="switch"
      accessibilityState={{ checked: mode === "mi" }}
      accessibilityLabel={
        mode === "en"
          ? "Váltás Mi módra (közösség)"
          : "Váltás Én módra (privát)"
      }
      borderless
      style={[styles.pill, { backgroundColor: pillBg }]}
      testID="mode-switch"
    >
      <View style={styles.row}>
        {half("en", "Én")}
        {half("mi", "Mi")}
      </View>
    </TouchableRipple>
  );
}

const styles = StyleSheet.create({
  pill: {
    width: 128,
    height: 48,
    borderRadius: BorderRadius.full,
    padding: 4,
    alignSelf: "center",
    overflow: "hidden",
  },
  row: {
    flex: 1,
    flexDirection: "row",
  },
  half: {
    flex: 1,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
});
