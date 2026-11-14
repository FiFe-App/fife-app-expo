import { theme, useAppTheme } from "@/assets/theme";
import { StyleSheet } from "react-native";

import {   Text, type TextProps } from "react-native-paper";

// The ref of paper's Text and of react-native's Text no longer line up under
// the strict React Native types, and nothing passes a ref to ThemedText.
export type ThemedTextProps = Omit<TextProps<Text>, "ref"> & {
  type?:
  | "default"
  | "title"
  | "defaultSemiBold"
  | "bold"
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
  const theme = useAppTheme();

  return (
    <Text
      style={[
        { color: theme.colors.onBackground, fontFamily: "RedHatText" },
        type === "link" ? styles.link : undefined,
        type === "error" ? styles.error : undefined,
        type === "defaultSemiBold" ? styles.defaultSemiBold : undefined,
        type === "bold" ? { fontFamily: "RedHatText-Bold"} : undefined,
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
    color: theme.colors.onError,
  },
  link: {
    color: theme.colors.secondary,
  },
  label: {
    fontSize: 14,
  },
});
