import { Spacing } from "@/constants/spacing";
import React from "react";
import { View, StyleSheet } from "react-native";
import { TextInput, useTheme } from "react-native-paper";

interface MessageInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function MessageInput({
  value,
  onChangeText,
  onSend,
  disabled = false,
}: MessageInputProps) {
  const theme = useTheme();

  const handleSend = () => {
    if (value.trim()) {
      onSend(value.trim());
    }
  };

  return (
    <View
      style={[
        styles.container
      ]}
    >
      <TextInput
        mode="outlined"
        placeholder="Írj üzenetet..."
        value={value}
        onChangeText={onChangeText}
        submitBehavior="blurAndSubmit"
        returnKeyType="send"
        onSubmitEditing={handleSend}
        disabled={disabled}
        multiline={false}
        maxLength={1000}
        style={styles.input}
        right={
          <TextInput.Icon
            icon="send-variant"
            color={theme.colors.secondary}
            onPress={handleSend}
            disabled={disabled || !value.trim()}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.sm
  },
  input: {
    backgroundColor: "transparent",
  },
});
