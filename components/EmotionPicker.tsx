import { EMOTIONS } from "@/constants/emotions";
import { Spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/borderRadius";
import { Image, Pressable, View } from "react-native";

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
          <Pressable
            key={emotion.rate}
            onPress={() => !disabled && onSelect(emotion.rate)}
            style={{
              alignItems: "center",
              padding: Spacing.xs,
              borderRadius: BorderRadius.sm,
              borderWidth: 2,
              borderColor: selected ? emotion.color : "transparent",
              opacity: disabled ? 0.5 : 1,
            }}
          >
            <View style={{ alignItems: "center", gap: 2 }}>
              <Image
                source={emotion.image}
                style={{
                  width: 50,
                  height: 50,
                }}
              />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
