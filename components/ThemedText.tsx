import { theme } from "@/assets/theme";
import { StyleSheet } from "react-native";

import { useTheme, Text, type TextProps } from "react-native-paper";

export type ThemedTextProps = TextProps<Text> & {
  type?:
  | "default"
  | "title"
  | "defaultSemiBold"
  | "subtitle"
  | "link"
  | "error"
  | "label"
  | "none";
};

export function ThemedText({
  style,
  type = "default",
  ...rest
}: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme.colors.onBackground, fontFamily: "RedHatText" },
        type === "link" ? styles.link : undefined,
        type === "error" ? styles.error : undefined,
        type === "defaultSemiBold" ? styles.defaultSemiBold : undefined,
        type === "none" && undefined,
        style,
      ]}
      variant={
        (type === "default" || !type) ? "bodyMedium" :
          type === "title" ? "displayMedium" :
            type === "subtitle" ? "headlineSmall" :
              type === "label"
                ? "labelMedium"
                : "bodyMedium"
      }
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontWeight: "bold",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 18,
  },
  error: {
    lineHeight: 30,
    fontSize: 16,
    color: theme.colors.error,
  },
  link: {
    color: theme.colors.secondary,
  },
  label: {
    fontSize: 14,
  },
});
