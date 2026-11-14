import { Pressable } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import type { TonePalette } from "./timerPalette";

/** The 52 px rounded buttons of the timer screens: filled for the main step. */
export default function PillButton({ label, onPress, palette, variant = "outlined" }: {
  label: string;
  onPress: () => void;
  palette: TonePalette;
  variant?: "filled" | "outlined";
}) {
  const filled = variant === "filled";
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        minWidth: filled ? 150 : 100,
        height: 52,
        paddingHorizontal: 22,
        borderRadius: 26,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: filled ? palette.fill : "transparent",
        borderWidth: filled ? 0 : 1.5,
        borderColor: palette.outline,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <ThemedText style={{ fontSize: 18, lineHeight: 24, fontFamily: "RedHatText-Medium", color: filled ? palette.onFill : palette.text }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}
