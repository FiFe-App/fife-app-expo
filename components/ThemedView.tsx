import { StyleSheet, View, useWindowDimensions, type ViewProps } from "react-native";
import  { useAppTheme } from "@/assets/theme";

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: "default" | "card" | "error";
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
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const isCol = responsive ? width <= responsive : false;
  
  const styles = StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
    },
    error: {
      backgroundColor: theme.colors.error,
      borderRadius: 8,
      padding: 6
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
        type === "error" ? styles.error : undefined,
        style,
        responsive ? (!isCol ? styles.flexRow : styles.flexCol) : undefined,
      ]}
      {...otherProps}
    />
  );
}
