import { Tables } from "@/database.types";
import { RootState } from "@/redux/store";
import React from "react";
import { View, StyleSheet } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";
import { useSelector } from "react-redux";

type Message = Tables<"messages">;

interface MessageItemProps {
  message: Message;
}

export function MessageItem({ message }: MessageItemProps) {
  const theme = useTheme();
  const { uid } = useSelector((state: RootState) => state.user);
  const isMyMessage = message.author === uid;

  const messageDate = new Date(message.created_at);
  const formattedTime = messageDate.toLocaleTimeString("hu-HU", {
    hour: "2-digit",
    minute: "2-digit",
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
      >
        <Card.Content style={styles.content}>
          <Text variant="bodyMedium">{message.text}</Text>
          <Text
            variant="labelSmall"
            style={[styles.time, { color: theme.colors.onSurfaceVariant }]}
          >
            {formattedTime}
          </Text>
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
