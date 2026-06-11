import { EMOTIONS } from "@/constants/emotions";
import { Spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/borderRadius";
import { View } from "react-native";
import { Icon, TouchableRipple } from "react-native-paper";
import { ThemedText } from "./ThemedText";

interface EmotionPickerProps {
  value: number | null;
  onSelect: (rate: number) => void;
  disabled?: boolean;
}

export default function EmotionPicker({ value, onSelect, disabled }: EmotionPickerProps) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-around", paddingVertical: Spacing.sm }}>
      {EMOTIONS.map((emotion) => {
        const selected = value === emotion.rate;
        return (
          <TouchableRipple
            key={emotion.rate}
            onPress={() => !disabled && onSelect(emotion.rate)}
            borderless
            style={{
              alignItems: "center",
              padding: Spacing.xs,
              borderRadius: BorderRadius.md,
              borderWidth: selected ? 2 : 0,
              borderColor: selected ? emotion.color : "transparent",
              opacity: disabled ? 0.5 : 1,
            }}
          >
            <View style={{ alignItems: "center", gap: 2 }}>
              <Icon
                source={emotion.icon}
                size={selected ? 38 : 30}
                color={emotion.color}
              />
              <ThemedText
                style={{ fontSize: 10, color: emotion.color }}
                type={selected ? "defaultSemiBold" : "default"}
              >
                {emotion.label}
              </ThemedText>
            </View>
          </TouchableRipple>
        );
      })}
    </View>
  );
}
