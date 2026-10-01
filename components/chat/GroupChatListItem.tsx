import { Spacing } from "@/constants/spacing";
import { GroupChatSummary } from "@/lib/chat/groupChats";
import { formatChatDate } from "@/lib/functions/formatChatDate";
import { Link } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Icon, Text, TouchableRipple, useTheme } from "react-native-paper";

interface GroupChatListItemProps {
  summary: GroupChatSummary;
  unread?: boolean;
}

export function GroupChatListItem({ summary, unread = false }: GroupChatListItemProps) {
  const theme = useTheme();
  const { group, lastMessage, lastMessageAuthorName, memberCount, isMember } = summary;

  const preview = lastMessage
    ? `${lastMessageAuthorName ? `${lastMessageAuthorName}: ` : ""}${lastMessage.text}`
    : isMember
      ? "Még nincs üzenet — írj elsőként!"
      : "Nyilvános csoport — csatlakozz!";

  return (
    <Link asChild href={`/group/${group.id}`}>
      <TouchableRipple>
        <View style={styles.card}>
          <View style={styles.content}>
            <View style={[styles.avatar, { backgroundColor: theme.colors.primaryContainer }]}>
              <Icon source="account-group" size={28} color={theme.colors.onPrimaryContainer} />
            </View>
            <View style={styles.textContainer}>
              <View style={styles.headerRow}>
                <Text variant="titleMedium" numberOfLines={1} style={styles.name}>
                  {group.title}
                </Text>
                {lastMessage && (
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {formatChatDate(lastMessage.created_at, "short")}
                  </Text>
                )}
              </View>
              <View style={styles.previewRow}>
                {unread && (
                  <View style={[styles.badge, { backgroundColor: theme.colors.secondary }]} />
                )}
                <Text
                  variant="bodyMedium"
                  numberOfLines={1}
                  style={[styles.preview, { color: theme.colors.onSurfaceVariant }]}
                >
                  {preview}
                </Text>
              </View>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {memberCount} tag{isMember ? " · Tag vagy" : ""}
              </Text>
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
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  name: {
    flex: 1,
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  preview: {
    flexShrink: 1,
  },
  badge: {
    width: 8,
    height: 8,
    borderRadius: 12,
    marginRight: 8,
  },
});
