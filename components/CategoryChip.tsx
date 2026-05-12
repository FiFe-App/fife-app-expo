import { Spacing } from "@/constants/spacing";
import { StyleProp, TextStyle, ViewStyle } from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";
import { BorderRadius } from "@/constants/borderRadius";

interface CategoryChipProps {
  children: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const CategoryChip = ({ children, style, textStyle }: CategoryChipProps) => (
    <ThemedView
    type="card"
    style={[{ padding: Spacing.xs, margin: Spacing.none, borderRadius: BorderRadius.md }, style]}
  >
    <ThemedText variant="labelMedium" style={textStyle}>{children}</ThemedText>
  </ThemedView>
);

export default CategoryChip;
