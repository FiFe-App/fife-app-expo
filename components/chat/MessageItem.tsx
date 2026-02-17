import { Tables } from "@/database.types";
import { RootState } from "@/redux/store";
import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";
import { useSelector } from "react-redux";
import { formatChatDate } from "@/lib/functions/formatChatDate";

type Message = Tables<"messages">;


interface MessageItemProps {
  message: Message;
  selected: boolean;
  onPress: () => void;
}
export function MessageItem({ message, selected, onPress }: MessageItemProps) {
  const theme = useTheme();
  const { uid } = useSelector((state: RootState) => state.user);
  const isMyMessage = message.author === uid;

  // Show short time if not selected, full timestamp if selected
  const formattedTime = formatChatDate(message.created_at, "time");
  const fullTime = new Date(message.created_at).toLocaleString("hu-HU", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <View
      style={[
        styles.container,
        isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer,
      ]}
    >
      <Card
        style={[
          styles.card,
          {
            backgroundColor: isMyMessage
              ? theme.colors.primaryContainer
              : theme.colors.surfaceVariant,
          },
        ]}
        onPress={onPress}
      >
        <Card.Content style={styles.content}>
          <Text variant="bodyMedium">{message.text}</Text>
          {selected && (
            <Text
              variant="labelSmall"
              style={[styles.time, { color: theme.colors.onSurfaceVariant }]}
            >
              {fullTime}
            </Text>
          )}
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 8,
  },
  myMessageContainer: {
    alignItems: "flex-end",
  },
  theirMessageContainer: {
    alignItems: "flex-start",
  },
  card: {
    maxWidth: "80%",
  },
  content: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  time: {
    marginTop: 4,
    alignSelf: "flex-end",
  },
});
