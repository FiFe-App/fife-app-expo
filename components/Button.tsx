import * as React from "react";
import { ViewStyle } from "react-native";
import { Button as ButtonP, useTheme } from "react-native-paper";
import type { ButtonProps } from "react-native-paper";
import { useBreakpoint } from "./layout/ResponsiveLayout";

export type ThemedButtonPProps = ButtonProps & {
  lightColor?: string;
  darkColor?: string;
  big?: boolean;
  type?: "default" | "secondary" | "tertiary";
};

export function Button({
  style,
  lightColor,
  darkColor,
  type = "default",
  big,
  compact,
  ...otherProps
}: ThemedButtonPProps) {
  const theme = useTheme();
  const { isDesktop } = useBreakpoint();

  console.log("theme", theme);

  const getButtonPColors = () => {
    if (type === "secondary") {
      return {
        backgroundColor: theme.colors.secondary,
        textColor: theme.colors.onSecondary,
      };
    }
    if (type === "tertiary") {
      return {
        backgroundColor: theme.colors.tertiary,
        textColor: theme.colors.onTertiary,
      };
    }
    return {
      backgroundColor: undefined,
      textColor: undefined,
    };
  };

  const { backgroundColor, textColor } = getButtonPColors();

  const ButtonPStyle: ViewStyle = {
    backgroundColor,
    justifyContent: "center",
  };

  return (
    <ButtonP
      textColor={textColor}
      labelStyle={[
        big && theme.fonts.headlineSmall,
        compact && theme.fonts.labelMedium,
        { fontFamily: "Piazzolla-ExtraBold", fontWeight: "bold" },
      ]}
      style={[
        ButtonPStyle,
        big && { maxHeight: 48, paddingVertical: 16, paddingHorizontal: 16 },
        compact &&
          (true
            ? {
              maxHeight: 12,
              paddingVertical: 12,
              paddingHorizontal: 4,
              borderRadius: 8,
            }
            : {}),
        style,
      ]}
      compact={compact}
      {...otherProps}
    />
  );
}
