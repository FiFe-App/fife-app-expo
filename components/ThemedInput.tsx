import { StyleSheet } from "react-native";
import {   TextInputProps, TextInput } from "react-native-paper";
import { BorderRadius } from "@/constants/borderRadius";
import { useAppTheme } from "@/assets/theme";

export type ThemedTextInputProps = TextInputProps & {};

export function ThemedInput({ style, ...otherProps }: ThemedTextInputProps) {
  const theme = useAppTheme();

  const styles = StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
    },
    default: {
      backgroundColor: theme.colors.surface,
      fontWeight: "300",
      fontFamily: "RedHatText",
    },
  });

  return (
    <TextInput
      placeholderTextColor={theme.colors.onSurfaceVariant}
      style={[styles.default, style]}
      outlineStyle={{
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        borderColor: theme.colors.onSurface,
      }}
      {...otherProps}
    />
  );
}
