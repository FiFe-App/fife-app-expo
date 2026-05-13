import * as React from "react";
import { ViewStyle } from "react-native";
import { Button as ButtonP } from "react-native-paper";
import { Spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/borderRadius";
import type { ButtonProps } from "react-native-paper";
import { useAppTheme } from "@/assets/theme";

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
  const theme = useAppTheme();

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
        big && { paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg },
        compact && {
          maxHeight: 12,
          paddingVertical: Spacing.md,
          paddingHorizontal: Spacing.xs,
          borderRadius: BorderRadius.md,
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
