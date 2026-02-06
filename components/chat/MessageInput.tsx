import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { IconButton, TextInput, useTheme } from "react-native-paper";

interface MessageInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, disabled = false }: MessageInputProps) {
  const theme = useTheme();
  const [text, setText] = useState("");

  const handleSend = () => {
    if (text.trim()) {
      onSend(text.trim());
      setText("");
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outline },
      ]}
    >
      <TextInput
        mode="flat"
        placeholder="Írj üzenetet..."
        value={text}
        onChangeText={setText}
        onSubmitEditing={handleSend}
        disabled={disabled}
        multiline
        maxLength={1000}
        style={styles.input}
        right={
          <TextInput.Icon
            icon="send"
            onPress={handleSend}
            disabled={disabled || !text.trim()}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    padding: 8,
  },
  input: {
    backgroundColor: "transparent",
  },
});
