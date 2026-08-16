import { BorderRadius } from "@/constants/borderRadius";
import { Spacing } from "@/constants/spacing";
import { Image } from "expo-image";
import * as ExpoImagePicker from "expo-image-picker";
import React from "react";
import { View, StyleSheet } from "react-native";
import { IconButton, TextInput, useTheme } from "react-native-paper";

interface MessageInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: (text: string) => void;
  image: ExpoImagePicker.ImagePickerAsset | null;
  onImageChange: (image: ExpoImagePicker.ImagePickerAsset | null) => void;
  disabled?: boolean;
}

export function MessageInput({
  value,
  onChangeText,
  onSend,
  image,
  onImageChange,
  disabled = false,
}: MessageInputProps) {
  const theme = useTheme();
  const canSend = !!value.trim() || !!image;

  const handleSend = () => {
    if (canSend) {
      onSend(value.trim());
    }
  };

  const pickImage = async () => {
    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      base64: true,
    }).catch((error) => {
      console.log(error);
    });

    if (result && !result.canceled) onImageChange(result.assets[0]);
  };

  return (
    <View style={styles.container}>
      {!!image && (
        <View style={styles.preview}>
          <Image
            source={image.uri}
            style={styles.previewImage}
            contentFit="cover"
          />
          <IconButton
            icon="close"
            size={16}
            mode="contained"
            containerColor={theme.colors.backdrop}
            iconColor="white"
            onPress={() => onImageChange(null)}
            accessibilityLabel="Kép eltávolítása"
            style={styles.previewRemove}
          />
        </View>
      )}
      <TextInput
        mode="outlined"
        placeholder="Írj üzenetet..."
        value={value}
        onChangeText={onChangeText}
        submitBehavior="submit"
        returnKeyType="send"
        onSubmitEditing={handleSend}
        disabled={disabled}
        multiline={false}
        maxLength={1000}
        style={styles.input}
        left={
          <TextInput.Icon
            icon="image-plus"
            color={theme.colors.secondary}
            onPress={pickImage}
            disabled={disabled}
            accessibilityLabel="Kép csatolása"
          />
        }
        right={
          <TextInput.Icon
            icon="send-variant"
            color={theme.colors.secondary}
            onPress={handleSend}
            disabled={disabled || !canSend}
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
  preview: {
    alignSelf: "flex-start",
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  previewImage: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.md,
  },
  previewRemove: {
    position: "absolute",
    top: -10,
    right: -10,
    margin: 0,
  },
});
