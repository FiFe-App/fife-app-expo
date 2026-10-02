import { Tables } from "@/database.types";
import { Link } from "expo-router";
import getMessagePreview from "@/lib/functions/getMessagePreview";
import { RootState } from "@/redux/store";
import React, { useEffect, useRef } from "react";
import { Pressable, View, StyleSheet } from "react-native";
import { Card, Icon, Text, useTheme } from "react-native-paper";
import { useSelector } from "react-redux";
import ProfileImage from "../ProfileImage";
import SupabaseImage from "../SupabaseImage";
import UrlText from "../UrlText";
import { SwipeToReply } from "./SwipeToReply";

// The fields both 1:1 messages and group chat messages have.
type Message = Pick<Tables<"messages">, "id" | "author" | "created_at" | "text" | "reply_to"> & {
  image?: string | null;
};
type AuthorProfile = Pick<Tables<"profiles">, "id" | "full_name" | "username" | "avatar_url">;

const AUTHOR_AVATAR_SIZE = 32;

const DOUBLE_TAP_DELAY = 250;

interface MessageItemProps {
  message: Message;
  selected: boolean;
  onPress: () => void;
  hearted: boolean;
  /** Group chats: how many people hearted it; shown next to the heart when more than one. */
  heartCount?: number;
  onToggleHeart: () => void;
  /** Opens the message's actions; leave it out when there are none to offer. */
  onLongPress?: () => void;
  /** Swiping the message right starts a reply to it; leave it out where replying is not possible. */
  onSwipeReply?: () => void;
  replyToMessage?: Message | null;
  replyToDeleted?: boolean;
  /** Tapping the quoted message jumps to it. */
  onReplyPress?: () => void;
  /** Briefly marks the message a jump landed on. */
  highlighted?: boolean;
  otherUserName?: string;
  /**
   * Group chats: the message's author. When given, other people's messages get
   * the author's profile picture next to them.
   */
  author?: AuthorProfile | null;
  /**
   * Group chats: first message of a run from the same author — shows the
   * name and picture; the rest of the run only keeps the picture's space.
   */
  showAuthor?: boolean;
}
export function MessageItem({
  message,
  selected,
  onPress,
  hearted,
  heartCount,
  onToggleHeart,
  onLongPress,
  onSwipeReply,
  replyToMessage,
  replyToDeleted,
  onReplyPress,
  highlighted = false,
  otherUserName,
  author,
  showAuthor = false,
}: MessageItemProps) {
  const theme = useTheme();
  const { uid } = useSelector((state: RootState) => state.user);
  const isMyMessage = message.author === uid;
  const withAuthor = author !== undefined && !isMyMessage;
  const authorName = author?.full_name || author?.username || "Ismeretlen";

  const tapTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPressRef = useRef(false);

  useEffect(() => {
    return () => {
      if (tapTimeout.current) clearTimeout(tapTimeout.current);
    };
  }, []);

  const handlePress = () => {
    if (didLongPressRef.current) {
      didLongPressRef.current = false;
      return;
    }
    if (tapTimeout.current) {
      clearTimeout(tapTimeout.current);
      tapTimeout.current = null;
      onToggleHeart();
    } else {
      tapTimeout.current = setTimeout(() => {
        tapTimeout.current = null;
        onPress();
      }, DOUBLE_TAP_DELAY);
    }
  };

  const handleLongPress = () => {
    if (tapTimeout.current) {
      clearTimeout(tapTimeout.current);
      tapTimeout.current = null;
    }
    didLongPressRef.current = true;
    onLongPress?.();
  };

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

  const content = (
    <View
      style={[
        styles.container,
        isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer,
        withAuthor && styles.withAuthorContainer,
        highlighted && { backgroundColor: theme.colors.secondaryContainer },
        highlighted && styles.highlighted,
      ]}
    >
      {withAuthor && showAuthor && (
        <Text
          variant="labelSmall"
          numberOfLines={1}
          style={[styles.authorName, { color: theme.colors.onSurfaceVariant }]}
        >
          {authorName}
        </Text>
      )}
      {(replyToMessage || replyToDeleted) && (
        <Pressable
          style={styles.replyContainer}
          onPress={onReplyPress}
          disabled={!replyToMessage || !onReplyPress}
          accessibilityRole={replyToMessage && onReplyPress ? "button" : undefined}
          accessibilityHint={replyToMessage && onReplyPress ? "Ugrás az eredeti üzenethez" : undefined}
        >
          <View style={[styles.replyBar, { backgroundColor: theme.colors.primary }]} />
          {replyToMessage ? (
            <View style={{ flex: 1 }}>

              <Text
                variant="bodySmall"
                numberOfLines={1}
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {getMessagePreview(replyToMessage)}
              </Text>
            </View>
          ) : (
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant, fontStyle: "italic" }}
            >
              Törölt üzenetre válaszolt
            </Text>
          )}
        </Pressable>
      )}
      <View>
        <Card
          mode="contained"
          style={[
            styles.card,
            {
              backgroundColor: colors[isMyMessage ? "my" : "their"].backgroundColor
            },
          ]}
          onPress={handlePress}
          onLongPress={handleLongPress}
        >
          <Card.Content style={styles.content}>
            {!!message.image && (
              <SupabaseImage
                bucket="messageImages"
                path={message.image}
                signed
                modal
                resizeMode="cover"
                style={[styles.image, !!message.text && styles.imageWithText]}
              />
            )}
            {!!message.text && (
              <UrlText
                text={message.text}
                style={{ color: colors[isMyMessage ? "my" : "their"].color }}
              />
            )}
          </Card.Content>
        </Card>
        {hearted && (
          <View
            style={[
              styles.heartBadge,
              isMyMessage ? { right: 4 } : { left: 4 },
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <Icon source="heart" size={14} color="#e0245e" />
            {!!heartCount && heartCount > 1 && (
              <Text variant="labelSmall" style={[styles.heartCount, { color: theme.colors.onSurface }]}>
                {heartCount}
              </Text>
            )}
          </View>
        )}
      </View>
      {selected && (
        <Text
          variant="labelSmall"
          style={[styles.time, { color: theme.colors.onSurfaceVariant }]}
        >
          {fullTime}
        </Text>
      )}
    </View>
  );

  const row = !withAuthor ? content : (
    <View style={styles.authorRow}>
      {showAuthor && author ? (
        <Link href={`/user/${author.id}`} asChild>
          <Pressable accessibilityRole="link" accessibilityLabel={authorName}>
            <ProfileImage
              uid={author.id}
              avatar_url={author.avatar_url}
              size={AUTHOR_AVATAR_SIZE}
              style={styles.authorAvatar}
            />
          </Pressable>
        </Link>
      ) : (
        <View style={styles.authorAvatarPlaceholder} />
      )}
      {content}
    </View>
  );

  return (
    <SwipeToReply enabled={!!onSwipeReply} onReply={() => onSwipeReply?.()}>
      {row}
    </SwipeToReply>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 8,
  },
  withAuthorContainer: {
    flex: 1,
    marginLeft: 4,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginLeft: 8,
  },
  authorAvatar: {
    width: AUTHOR_AVATAR_SIZE,
    height: AUTHOR_AVATAR_SIZE,
    borderRadius: 8,
    marginTop: 4,
  },
  authorAvatarPlaceholder: {
    width: AUTHOR_AVATAR_SIZE,
  },
  authorName: {
    marginLeft: 4,
    marginBottom: 2,
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
  image: {
    width: 220,
    height: 220,
    borderRadius: 8,
  },
  imageWithText: {
    marginBottom: 8,
  },
  time: {
    marginLeft: 4,
    marginTop: 4,
  },
  replyContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    maxWidth: "80%",
    marginBottom: 2,
    paddingHorizontal: 4,
  },
  replyBar: {
    width: 3,
    alignSelf: "stretch",
    borderRadius: 2,
  },
  heartBadge: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    bottom: -8,
    borderRadius: 10,
    padding: 2,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  heartCount: {
    marginLeft: 2,
    marginRight: 2,
  },
  highlighted: {
    borderRadius: 12,
  },
});
