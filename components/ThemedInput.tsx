import { StyleSheet } from "react-native";
import { useTheme, TextInputProps, TextInput } from "react-native-paper";

export type ThemedTextInputProps = TextInputProps & {};

export function ThemedInput({ style, ...otherProps }: ThemedTextInputProps) {
  const theme = useTheme();

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
      placeholderTextColor={theme.colors.backdrop}
      style={[styles.default, style]}
      outlineStyle={{
        borderWidth: 1,
        borderRadius: 8,
        borderColor: theme.colors.onSurface,
      }}
      {...otherProps}
    />
  );
}
