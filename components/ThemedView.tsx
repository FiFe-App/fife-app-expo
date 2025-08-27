import { StyleSheet, View, type ViewProps } from "react-native";

import { useTheme } from "react-native-paper";

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: "default" | "card";
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  type,
  ...otherProps
}: ThemedViewProps) {
  const theme = useTheme();

  console.log(theme.colors);

  const styles = StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
    },
    default: {
      backgroundColor: theme.colors.background,
    },
  });
  return (
    <View
      style={[
        type === "default" ? styles.default : undefined,
        type === "card" ? styles.card : undefined,
        style,
      ]}
      {...otherProps}
    />
  );
}
