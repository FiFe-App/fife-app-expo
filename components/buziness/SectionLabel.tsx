import { View } from "react-native";
import { Text } from "react-native-paper";
import { Spacing } from "@/constants/spacing";
import { useAppTheme } from "@/assets/theme";

interface SectionLabelProps {
  label: string;
  optional?: boolean;
  required?: boolean;
}

export default function SectionLabel({
  label,
  optional,
  required,
}: SectionLabelProps) {
  const theme = useAppTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "baseline",
        gap: Spacing.xs,
        paddingLeft: Spacing.xs,
      }}
    >
      <Text
        variant="titleMedium"
        style={{ color: theme.colors.onSurface, fontWeight: "600" }}
      >
        {label}
        {required && (
          <Text style={{ color: theme.colors.error }}> *</Text>
        )}
      </Text>
      {optional && (
        <Text
          variant="bodySmall"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          (nem kötelező)
        </Text>
      )}
    </View>
  );
}
