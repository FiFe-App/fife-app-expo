import { BorderRadius } from "@/constants/borderRadius";
import { Spacing } from "@/constants/spacing";
import React from "react";
import { View, ViewProps } from "react-native";
import { useTheme } from "react-native-paper";

/**
 * The card every Paper Modal in the app shows its content in. The size cap sits
 * on this plain View, not on the Modal: Paper's Surface applies percentage caps
 * twice on iOS. Give the Modal `contentContainerStyle={modalContainerStyle}`.
 */
export const modalContainerStyle = { marginHorizontal: Spacing.xl } as const;

export function ModalCard({ style, ...props }: ViewProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        {
          width: "100%",
          maxWidth: 420,
          alignSelf: "center",
          padding: Spacing.lg,
          borderRadius: BorderRadius.lg,
          backgroundColor: theme.colors.background,
        },
        style,
      ]}
      {...props}
    />
  );
}
