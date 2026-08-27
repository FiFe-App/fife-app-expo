import ProfileImage from "@/components/ProfileImage";
import { Tables } from "@/database.types";
import { Link } from "expo-router";
import React from "react";
import { View, StyleSheet } from "react-native";
import { Card, Text, TouchableRipple, useTheme } from "react-native-paper";
import { formatChatDate } from "@/lib/functions/formatChatDate";
import getMessagePreview from "@/lib/functions/getMessagePreview";
import { BorderRadius } from "@/constants/borderRadius";
import { Spacing } from "@/constants/spacing";

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
        <View style={styles.card}>
          <View style={styles.content}>
            <ProfileImage
              uid={otherUser.id}
              avatar_url={otherUser.avatar_url}
              style={[styles.avatar,{borderRadius:BorderRadius.md}]}
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
              <View style={{flexDirection:"row",alignItems:"center"}}>
                
                {unreadCount > 0 && (
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: theme.colors.secondary,marginHorizontal:8 },
                    ]}
                  >
                  </View>
                )}  
                {lastMessage && (
                  <Text
                    variant="bodyMedium"
                    numberOfLines={1}
                    style={{
                      color: theme.colors.onSurfaceVariant,
                    }}
                  >
                    {getMessagePreview({ ...lastMessage, otherUser })}
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
            </View>
          </View>
        </View>
      </TouchableRipple>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.lg,
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
    width: 8,
    height: 8,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
});
