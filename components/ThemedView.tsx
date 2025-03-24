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

  const styles = StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
    },
  });

  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.background,
        },
        type === "card" ? styles.card : undefined,
        style,
      ]}
      {...otherProps}
    />
  );
}
