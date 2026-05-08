import { Spacing } from "@/constants/spacing";
import { ReactNode } from "react";
import { View } from "react-native";
import { Icon, Text, useTheme } from "react-native-paper";

interface MetaStatProps {
  icon: string;
  children: ReactNode;
}

const MetaStat = ({ icon, children }: MetaStatProps) => {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.xs }}>
      <Icon size={16} source={icon} color={theme.colors.primary} />
      <Text>{children}</Text>
    </View>
  );
};

export default MetaStat;
