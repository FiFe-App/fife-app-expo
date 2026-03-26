import * as React from "react";
import { ViewStyle } from "react-native";
import { Button as ButtonP, useTheme } from "react-native-paper";
import type { ButtonProps } from "react-native-paper";

export type ThemedButtonPProps = ButtonProps & {
  lightColor?: string;
  darkColor?: string;
  big?: boolean;
  type?: "default" | "secondary" | "tertiary";
};

export function Button({
  style,
  type = "default",
  big,
  compact,
  mode,
  children,
  ...otherProps
}: ThemedButtonPProps) {
  const theme = useTheme();

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
    // When mode="contained", Paper fills with primary — use onPrimary text
    if (mode === "contained") {
      return {
        backgroundColor: undefined,
        textColor: theme.colors.onPrimary,
      };
    }
    if (mode === "contained-tonal") {
      return {
        backgroundColor: undefined,
        textColor: theme.colors.onSecondaryContainer,
      };
    }
    return {
      backgroundColor: "transparent",
      textColor: theme.colors.primary,
    };
  };

  const { backgroundColor, textColor } = getButtonPColors();

  const ButtonPStyle: ViewStyle = {
    ...(backgroundColor != null && { backgroundColor }),
    justifyContent: "center",
  };

  return (
    <ButtonP
      textColor={textColor}
      labelStyle={[
        big && theme.fonts.headlineSmall,
        compact && theme.fonts.labelMedium,
        { fontFamily: "Piazzolla-ExtraBold" },
      ]}
      style={[
        ButtonPStyle,
        big && { maxHeight: 48, paddingVertical: 16, paddingHorizontal: 16 },
        compact && {
          maxHeight: 12,
          paddingVertical: 12,
          paddingHorizontal: 4,
          borderRadius: 8,
        },
        style,
      ]}
      compact={compact}
      mode={mode}
      {...otherProps}
    >
      {children}
    </ButtonP>
  );
}
