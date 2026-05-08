import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { StyleProp, TextStyle, ViewStyle } from "react-native";

interface CategoryChipProps {
  children: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const CategoryChip = ({ children, style, textStyle }: CategoryChipProps) => (
  <ThemedView
    type="card"
    style={[{ paddingHorizontal: 4, borderRadius: 6, paddingVertical: 2, justifyContent: "center" }, style]}
  >
    <ThemedText variant="labelLarge" type="bold" style={textStyle}>{children}</ThemedText>
  </ThemedView>
);

export default CategoryChip;
