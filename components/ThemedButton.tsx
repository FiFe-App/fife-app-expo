import * as React from "react";
import { ViewStyle } from "react-native";
import { Button, useTheme } from "react-native-paper";
import type { ButtonProps } from "react-native-paper";

export type ThemedButtonProps = ButtonProps & {
  lightColor?: string;
  darkColor?: string;
  type?: "default" | "secondary" | "tertiary";
};

export function ThemedButton({
  style,
  lightColor,
  darkColor,
  type = "default",
  ...otherProps
}: ThemedButtonProps) {
  const theme = useTheme();

  const getButtonColors = () => {
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

  const { backgroundColor, textColor } = getButtonColors();

  const buttonStyle: ViewStyle = {
    backgroundColor,
  };

  return (
    <Button
      textColor={textColor}
      style={[buttonStyle, style]}
      {...otherProps}
    />
  );
}
