import { StyleSheet, Text, type TextProps } from "react-native";

import { DefaultTheme, MD3DarkTheme, useTheme } from "react-native-paper";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
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
  lightColor,
  darkColor,
  type = "default",
  ...rest
}: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme.colors.onBackground, fontFamily: "Piazzolla" },
        type === "default" ? styles.default : undefined,
        type === "title" ? styles.title : undefined,
        type === "defaultSemiBold" ? styles.defaultSemiBold : undefined,
        type === "subtitle" ? styles.subtitle : undefined,
        type === "link" ? styles.link : undefined,
        type === "error" ? styles.error : undefined,
        type === "label"
          ? { ...styles.label, color: theme.colors.onBackground }
          : undefined,
        type === "none" && undefined,
        style,
      ]}
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
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
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
    color: DefaultTheme.colors.error,
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: MD3DarkTheme.colors.primary,
  },
  label: {
    fontSize: 14,
  },
});
