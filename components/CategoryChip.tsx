import { Spacing } from "@/constants/spacing";
import { StyleProp, TextStyle, ViewStyle } from "react-native";
import { Chip, Text } from "react-native-paper";

interface CategoryChipProps {
  children: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const CategoryChip = ({ children, style, textStyle }: CategoryChipProps) => (
  <Chip style={style} textStyle={[{ margin: Spacing.xs }, textStyle]}>
    <Text variant="labelMedium">{children}</Text>
  </Chip>
);

export default CategoryChip;
