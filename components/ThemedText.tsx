import { StyleSheet } from "react-native";

import { DefaultTheme, MD3DarkTheme, useTheme, Text, type TextProps } from "react-native-paper";

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
        { color: theme.colors.onBackground, fontFamily: "Piazzolla" },
        type === "defaultSemiBold" && styles.defaultSemiBold,
        style,
      ]}
      variant={
        type === "default" ? "bodyMedium" :
          type === "title" ? "displayMedium" :
            type === "defaultSemiBold" ? "bodyMedium" :
              type === "subtitle" ? "headlineSmall" :
                type === "link" ? "bodyMedium" :
                  type === "error" ? "bodyMedium" :
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
