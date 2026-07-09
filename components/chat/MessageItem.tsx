import { Tables } from "@/database.types";
import { RootState } from "@/redux/store";
import { BorderRadius } from "@/constants/borderRadius";
import React, { useState } from "react";
import { Pressable, View, StyleSheet } from "react-native";
import { Card, Modal, Portal, Text, useTheme } from "react-native-paper";
import { useSelector } from "react-redux";
import SupabaseImage from "../SupabaseImage";

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
  const [imageExpanded, setImageExpanded] = useState(false);

  // Show short time if not selected, full timestamp if selected
  const fullTime = new Date(message.created_at).toLocaleString("hu-HU", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const colors = {
    my:    { 
      color: theme.colors.onPrimaryContainer, 
      backgroundColor: theme.colors.primaryContainer 
    },
    their: { 
      color: theme.colors.onSurface, 
      backgroundColor: theme.colors.surface
    }
  };

  return (
    <View
      style={[
        styles.container,
        isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer,
      ]}
    >
      <Card
        mode="contained"
        style={[
          styles.card,
          {
            backgroundColor: colors[isMyMessage ? "my" : "their"].backgroundColor
          },
        ]}
        onPress={onPress}
      >
        <Card.Content style={styles.content}>
          <Text variant="bodyMedium"
        style={[
          {
            color: colors[isMyMessage ? "my" : "their"].color
          },
        ]} >{message.text}</Text>
          {message.image && (
            <Pressable onPress={() => setImageExpanded(true)}>
              <SupabaseImage
                bucket="messageImages"
                path={message.image}
                signed
                style={styles.attachedImage}
              />
            </Pressable>
          )}
        </Card.Content>
      </Card>
      {selected && (
        <Text
          variant="labelSmall"
          style={[styles.time, { color: theme.colors.onSurfaceVariant }]}
        >
          {fullTime}
        </Text>
      )}
      {message.image && (
        <Portal>
          <Modal
            visible={imageExpanded}
            onDismiss={() => setImageExpanded(false)}
            contentContainerStyle={{ shadowOpacity: 0 }}
          >
            <Pressable onPress={() => setImageExpanded(false)}>
              <SupabaseImage
                bucket="messageImages"
                path={message.image}
                signed
                style={{ height: 600 }}
                resizeMode="contain"
              />
            </Pressable>
          </Modal>
        </Portal>
      )}
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
  attachedImage: {
    width: 160,
    height: 160,
    borderRadius: BorderRadius.md,
    marginTop: 8,
  },
  time: {
    marginLeft: 4,
    marginTop: 4,
  },
});
