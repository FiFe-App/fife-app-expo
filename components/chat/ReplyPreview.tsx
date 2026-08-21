import { Tables } from "@/database.types";
import getMessagePreview from "@/lib/functions/getMessagePreview";
import { Spacing } from "@/constants/spacing";
import React from "react";
import { View, StyleSheet } from "react-native";
import { IconButton, Text, useTheme } from "react-native-paper";

type Message = Tables<"messages">;

interface ReplyPreviewProps {
  message: Message;
  authorLabel: string;
  onCancel: () => void;
}

export function ReplyPreview({ message, authorLabel, onCancel }: ReplyPreviewProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outlineVariant },
      ]}
    >
      <View style={[styles.bar, { backgroundColor: theme.colors.primary }]} />
      <View style={styles.textContainer}>
        <Text
          variant="labelSmall"
          style={{ color: theme.colors.onSurfaceVariant, fontWeight: "bold" }}
          numberOfLines={1}
        >
          Válasz neki: {authorLabel}
        </Text>
        <Text
          variant="bodySmall"
          numberOfLines={1}
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          {getMessagePreview(message)}
        </Text>
      </View>
      <IconButton icon="close" size={18} onPress={onCancel} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.sm,
    marginTop: Spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 4,
    paddingLeft: 8,
  },
  bar: {
    width: 3,
    alignSelf: "stretch",
    borderRadius: 2,
    marginRight: 8,
  },
  textContainer: {
    flex: 1,
  },
});
