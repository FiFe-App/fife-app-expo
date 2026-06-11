import ProfileImage from "@/components/ProfileImage";
import { Tables } from "@/database.types";
import { Link } from "expo-router";
import React from "react";
import { View, StyleSheet } from "react-native";
import { Card, Text, TouchableRipple, useTheme } from "react-native-paper";
import { formatChatDate } from "@/lib/functions/formatChatDate";

type Message = Tables<"messages">;
type Profile = Tables<"profiles">;

interface ChatListItemProps {
  otherUser: Profile;
  lastMessage: Message | null;
  unreadCount?: number;
}

export function ChatListItem({
  otherUser,
  lastMessage,
  unreadCount = 0,
}: ChatListItemProps) {
  const theme = useTheme();

  const formattedTime = lastMessage
    ? formatChatDate(lastMessage.created_at, "short")
    : "";

  return (
    <Link asChild href={`/chat/${otherUser.id}`}>
      <TouchableRipple>
        <Card style={styles.card}>
          <Card.Content style={styles.content}>
            <ProfileImage
              uid={otherUser.id}
              avatar_url={otherUser.avatar_url}
              style={styles.avatar}
            />
            <View style={styles.textContainer}>
              <View style={styles.headerRow}>
                <Text variant="titleMedium" numberOfLines={1} style={styles.name}>
                  {otherUser.full_name}
                </Text>
                {lastMessage && (
                  <Text
                    variant="labelSmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    {formattedTime}
                  </Text>
                )}
              </View>
              {lastMessage && (
                <Text
                  variant="bodyMedium"
                  numberOfLines={1}
                  style={{
                    color: theme.colors.onSurfaceVariant,
                  }}
                >
                  {lastMessage.text}
                </Text>
              )}
              {!lastMessage && (
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  Üzenet küldése
                </Text>
              )}
            </View>
            {unreadCount > 0 && (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                <Text
                  variant="labelSmall"
                  style={{ color: theme.colors.onPrimary }}
                >
                  {unreadCount}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>
      </TouchableRipple>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 8,
    marginVertical: 4,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  name: {
    flex: 1,
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    marginLeft: 8,
  },
});
