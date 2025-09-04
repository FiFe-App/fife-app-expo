import { StyleSheet, View, type ViewProps } from "react-native";
import { useTheme } from "react-native-paper";
import { useMediaQuery } from "react-responsive";

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: "default" | "card";
  responsive?: number;
  reverseOnCol?: boolean;
};

export function ThemedView({
  style,
  type,
  responsive,
  reverseOnCol,
  ...otherProps
}: ThemedViewProps) {
  const theme = useTheme();
  // Normalize to the same breakpoints used in ResponsiveLayout
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const isCol = responsive ? useMediaQuery({ maxWidth: responsive }) : false;
  
  const styles = StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
    },
    default: {
      backgroundColor: theme.colors.background,
    },
    flexCol: {
      flexDirection: !reverseOnCol ? "column" : "column-reverse",
    },
    flexRow: {
      flexDirection: "row",
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
        responsive ? (!isCol ? styles.flexRow : styles.flexCol) : undefined,
      ]}
      {...otherProps}
    />
  );
}
