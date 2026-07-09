import { Spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/borderRadius";
import * as ExpoImagePicker from "expo-image-picker";
import React from "react";
import { ImageBackground, StyleSheet, View } from "react-native";
import { IconButton, TextInput, useTheme } from "react-native-paper";

interface MessageInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: (text: string) => void;
  disabled?: boolean;
  image: ExpoImagePicker.ImagePickerAsset | null;
  onPickImage: () => void;
  onRemoveImage: () => void;
}

export function MessageInput({
  value,
  onChangeText,
  onSend,
  disabled = false,
  image,
  onPickImage,
  onRemoveImage,
}: MessageInputProps) {
  const theme = useTheme();

  const handleSend = () => {
    if (value.trim()) {
      onSend(value.trim());
    }
  };

  return (
    <View style={styles.container}>
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
        style={[styles.input, { paddingRight: image ? 96 : 56 }]}
      />
      <View style={styles.accessories}>
        {image ? (
          <ImageBackground
            source={{ uri: image.uri }}
            style={styles.imagePreview}
            imageStyle={{ borderRadius: BorderRadius.sm }}
          >
            <IconButton icon="close" size={16} onPress={onRemoveImage} />
          </ImageBackground>
        ) : (
          <IconButton icon="image" onPress={onPickImage} disabled={disabled} />
        )}
        <IconButton
          icon="send-variant"
          iconColor={theme.colors.secondary}
          onPress={handleSend}
          disabled={disabled || !value.trim()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.sm,
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "transparent",
  },
  accessories: {
    position: "absolute",
    right: Spacing.sm + 4,
    flexDirection: "row",
    alignItems: "center",
  },
  imagePreview: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
});
