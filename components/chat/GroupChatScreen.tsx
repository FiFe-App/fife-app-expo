import ErrorScreen from "@/components/ErrorScreen";
import ProfileImage from "@/components/ProfileImage";
import { ThemedView } from "@/components/ThemedView";
import { Spacing } from "@/constants/spacing";
import { Tables } from "@/database.types";
import {
  fetchGroupMembers,
  fetchGroupMembership,
  GroupChat,
  groupChatKey,
  GroupChatMessage,
  joinGroupChat,
  leaveGroupChat,
} from "@/lib/chat/groupChats";
import { useJumpToMessage } from "@/hooks/useJumpToMessage";
import { useReplyTargets } from "@/hooks/useReplyTargets";
import { isSameCalendarDay } from "@/lib/functions/formatChatDate";
import { supabase } from "@/lib/supabase/supabase";
import { clearDraftMessage, setDraftMessage, setLastReadAt } from "@/redux/reducers/chatReducer";
import { addSnack, clearOptions, setOptions } from "@/redux/reducers/infoReducer";
import { RootState } from "@/redux/store";
import { RealtimeChannel } from "@supabase/supabase-js";
import { Link, useFocusEffect, useLocalSearchParams, useNavigation } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Icon,
  List,
  Modal,
  Portal,
  Text,
  useTheme,
} from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { MyAppbar } from "../MyAppBar";
import { DateSeparator } from "./DateSeparator";
import { MessageActionsSheet } from "./MessageActionsSheet";
import { MessageInput } from "./MessageInput";
import { MessageItem } from "./MessageItem";
import { ReplyPreview } from "./ReplyPreview";

type AuthorProfile = Pick<Tables<"profiles">, "id" | "full_name" | "username" | "avatar_url">;
type Member = { user_id: string; joined_at: string; profiles: AuthorProfile | null };

const PAGE_SIZE = 30;

/** Messages further apart than this get extra breathing room between them. */
const LARGE_GAP_THRESHOLD_MS = 60 * 60 * 1000;

// Same inverted-FlatList layout as ChatScreen (see the comment there). Anyone
// signed in can read a public group; posting needs a row in
// group_chat_members, which the "Csatlakozom" button creates.
export default function GroupChatScreen() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const navigation = useNavigation();
  const { id: groupId } = useLocalSearchParams<{ id: string }>();
  const { uid: myUid } = useSelector((state: RootState) => state.user);
  const chatKey = groupId ? groupChatKey(groupId) : "";
  const draft = useSelector((state: RootState) =>
    chatKey ? state.chat.drafts[chatKey] ?? "" : "",
  );

  const [group, setGroup] = useState<GroupChat | null>(null);
  const [groupNotFound, setGroupNotFound] = useState(false);
  const [isMember, setIsMember] = useState<boolean | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [members, setMembers] = useState<Member[] | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [joining, setJoining] = useState(false);

  const [messages, setMessages] = useState<GroupChatMessage[]>([]);
  const [profiles, setProfiles] = useState<Record<string, AuthorProfile>>({});
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [oldestLoadedCreatedAt, setOldestLoadedCreatedAt] = useState<string | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null);
  const [replyingTo, setReplyingTo] = useState<GroupChatMessage | null>(null);
  const [actionsMessage, setActionsMessage] = useState<GroupChatMessage | null>(null);
  // message id → ids of the users who hearted it
  const [hearts, setHearts] = useState<Map<number, Set<string>>>(new Map());
  const listRef = useRef<FlatList<GroupChatMessage>>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const requestedProfiles = useRef(new Set<string>());
  const mountId = useRef(Date.now()).current;

  // Author profiles are loaded once per author and kept for the screen's life.
  const loadProfiles = useCallback(async (authorIds: string[]) => {
    const missing = [...new Set(authorIds)].filter(
      (id) => !requestedProfiles.current.has(id),
    );
    if (missing.length === 0) return;
    missing.forEach((id) => requestedProfiles.current.add(id));

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url")
      .in("id", missing);

    if (error) {
      console.error("Error loading message authors:", error);
      missing.forEach((id) => requestedProfiles.current.delete(id));
      return;
    }
    setProfiles((prev) => {
      const next = { ...prev };
      (data ?? []).forEach((p) => (next[p.id] = p));
      return next;
    });
  }, []);

  const addHeart = useCallback((messageId: number, userId: string) => {
    setHearts((prev) => {
      if (prev.get(messageId)?.has(userId)) return prev;
      const next = new Map(prev);
      next.set(messageId, new Set(prev.get(messageId)).add(userId));
      return next;
    });
  }, []);

  const removeHeart = useCallback((messageId: number, userId: string) => {
    setHearts((prev) => {
      if (!prev.get(messageId)?.has(userId)) return prev;
      const next = new Map(prev);
      const users = new Set(prev.get(messageId));
      users.delete(userId);
      next.set(messageId, users);
      return next;
    });
  }, []);

  // Hearts are loaded alongside each page of messages.
  const loadHearts = useCallback(
    async (messageIds: number[]) => {
      if (messageIds.length === 0) return;
      const { data, error } = await supabase
        .from("group_chat_message_hearts")
        .select("message_id, user_id")
        .in("message_id", messageIds);
      if (error) {
        console.error("Error loading hearts:", error);
        return;
      }
      (data ?? []).forEach((h) => addHeart(h.message_id, h.user_id));
    },
    [addHeart],
  );

  const loadMemberCount = useCallback(async () => {
    if (!groupId) return;
    const { count } = await supabase
      .from("group_chat_members")
      .select("user_id", { count: "exact", head: true })
      .eq("group_id", groupId);
    setMemberCount(count ?? 0);
  }, [groupId]);

  const loadMembers = useCallback(async () => {
    if (!groupId) return;
    const data = await fetchGroupMembers(groupId);
    if (data) setMembers(data as Member[]);
  }, [groupId]);

  // Group, membership and blocked users
  useEffect(() => {
    if (!groupId || !myUid) return;

    supabase
      .from("group_chats")
      .select("*")
      .eq("id", groupId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error("Error loading group chat:", error);
        if (!data) setGroupNotFound(!error);
        setGroup(data ?? null);
      });

    fetchGroupMembership(groupId, myUid).then((member) => {
      // An unknown answer falls back to showing the join button: joining is an
      // idempotent upsert, so pressing it as an existing member is harmless.
      setIsMember(member ?? false);
    });

    loadMemberCount();

    supabase
      .from("blocked_users")
      .select("blocked_id")
      .eq("blocker_id", myUid)
      .then(({ data }) => setBlockedIds(new Set((data ?? []).map((b) => b.blocked_id))));
  }, [groupId, myUid, loadMemberCount]);

  const leave = useCallback(async () => {
    if (!groupId || !myUid) return;
    if (await leaveGroupChat(groupId, myUid)) {
      setIsMember(false);
      loadMemberCount();
      dispatch(addSnack({ title: "Kiléptél a csoportból." }));
    } else {
      dispatch(addSnack({ title: "A kilépés nem sikerült." }));
    }
  }, [groupId, myUid, loadMemberCount, dispatch]);

  // Header + options menu
  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({
        header: () => (
          <MyAppbar
            center={
              group && (
                <View style={styles.headerContent}>
                  <View style={[styles.groupIcon, { backgroundColor: theme.colors.primaryContainer }]}>
                    <Icon source="account-group" size={22} color={theme.colors.onPrimaryContainer} />
                  </View>
                  <View style={styles.headerText}>
                    <Text variant="titleMedium" numberOfLines={1}>
                      {group.title}
                    </Text>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {memberCount} tag
                    </Text>
                  </View>
                </View>
              )
            }
            style={{ elevation: 0, shadowOpacity: 0, borderBottomWidth: 0 }}
          />
        ),
      });

      dispatch(
        setOptions([
          {
            icon: "account-multiple",
            title: "Tagok",
            onPress: () => {
              setShowMembers(true);
              loadMembers();
            },
          },
          ...(isMember
            ? [{ icon: "logout", title: "Kilépés a csoportból", onPress: leave }]
            : []),
        ]),
      );

      return () => {
        dispatch(clearOptions());
      };
    }, [navigation, group, memberCount, isMember, theme, dispatch, loadMembers, leave]),
  );

  const markRead = useCallback(
    (page: GroupChatMessage[]) => {
      if (!chatKey) return;
      dispatch(
        setLastReadAt({
          chatId: chatKey,
          lastReadAt: page.length > 0 ? page[0].created_at : new Date().toISOString(),
        }),
      );
    },
    [chatKey, dispatch],
  );

  const loadMessages = useCallback(async () => {
    if (!groupId) return;

    const { data, error } = await supabase
      .from("group_chat_messages")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (error) {
      console.error("Error loading group messages:", error);
      setLoading(false);
      return;
    }

    const page = data || [];
    await loadProfiles(page.map((m) => m.author));
    loadHearts(page.map((m) => m.id));
    setMessages(page);
    setHasMoreOlder(page.length === PAGE_SIZE);
    setOldestLoadedCreatedAt(page.length > 0 ? page[page.length - 1].created_at : null);
    markRead(page);
    setLoading(false);
  }, [groupId, loadProfiles, loadHearts, markRead]);

  const loadOlderMessages = useCallback(async () => {
    if (!groupId || loadingOlder || !hasMoreOlder || !oldestLoadedCreatedAt) return;
    setLoadingOlder(true);

    const { data, error } = await supabase
      .from("group_chat_messages")
      .select("*")
      .eq("group_id", groupId)
      .lt("created_at", oldestLoadedCreatedAt)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (error) {
      console.error("Error loading older group messages:", error);
      setLoadingOlder(false);
      return;
    }

    const olderPage = data || [];
    await loadProfiles(olderPage.map((m) => m.author));
    loadHearts(olderPage.map((m) => m.id));
    setMessages((prev) => [...prev, ...olderPage]);
    setHasMoreOlder(olderPage.length === PAGE_SIZE);
    if (olderPage.length > 0) setOldestLoadedCreatedAt(olderPage[olderPage.length - 1].created_at);
    setLoadingOlder(false);
  }, [groupId, loadingOlder, hasMoreOlder, oldestLoadedCreatedAt, loadProfiles, loadHearts]);

  // Everything between the oldest loaded message and `createdAt`, so a quoted
  // message further back can be scrolled to.
  const loadThrough = useCallback(async (createdAt: string) => {
    if (!groupId || !oldestLoadedCreatedAt) return;

    const { data, error } = await supabase
      .from("group_chat_messages")
      .select("*")
      .eq("group_id", groupId)
      .gte("created_at", createdAt)
      .lt("created_at", oldestLoadedCreatedAt)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading group messages up to the quoted one:", error);
      return;
    }

    const olderPage = data || [];
    await loadProfiles(olderPage.map((m) => m.author));
    loadHearts(olderPage.map((m) => m.id));
    setMessages((prev) => {
      const ids = new Set(prev.map((m) => m.id));
      return [...prev, ...olderPage.filter((m) => !ids.has(m.id))];
    });
    if (olderPage.length > 0) setOldestLoadedCreatedAt(olderPage[olderPage.length - 1].created_at);
  }, [groupId, oldestLoadedCreatedAt, loadProfiles, loadHearts]);

  // Initial load + realtime
  useEffect(() => {
    if (!groupId || !myUid) return;

    loadMessages();

    const channel = supabase
      .channel(`group_chat:${groupId}:${mountId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_chat_messages",
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          const newMessage = payload.new as GroupChatMessage;
          loadProfiles([newMessage.author]);
          setMessages((prev) =>
            prev.some((m) => m.id === newMessage.id) ? prev : [newMessage, ...prev],
          );
          markRead([newMessage]);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "group_chat_messages",
        },
        (payload) => {
          const oldId = (payload.old as { id?: number } | null)?.id;
          if (oldId == null) return;
          setMessages((prev) => prev.filter((m) => m.id !== oldId));
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_chat_message_hearts",
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          const heart = payload.new as { message_id: number; user_id: string };
          addHeart(heart.message_id, heart.user_id);
        },
      )
      .on(
        "postgres_changes",
        // DELETE events cannot be filtered; the old row is just its primary
        // key, and a heart on a message not shown here changes nothing.
        { event: "DELETE", schema: "public", table: "group_chat_message_hearts" },
        (payload) => {
          const heart = payload.old as { message_id?: number; user_id?: string } | null;
          if (heart?.message_id == null || !heart.user_id) return;
          removeHeart(heart.message_id, heart.user_id);
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [groupId, myUid, loadMessages, loadProfiles, markRead, mountId, addHeart, removeHeart]);

  const join = async () => {
    if (!groupId || !myUid || joining) return;
    setJoining(true);
    const ok = await joinGroupChat(groupId, myUid);
    setJoining(false);
    if (ok) {
      setIsMember(true);
      loadMemberCount();
      if (showMembers) loadMembers();
    } else {
      dispatch(addSnack({ title: "A csatlakozás nem sikerült." }));
    }
  };

  const setDraft = useCallback(
    (text: string) => {
      if (!chatKey) return;
      dispatch(setDraftMessage({ chatId: chatKey, draft: text }));
    },
    [dispatch, chatKey],
  );

  const sendMessage = async (text: string) => {
    if (!myUid || !groupId || sending || !isMember || !text) return;
    setSending(true);

    const { data, error } = await supabase
      .from("group_chat_messages")
      .insert({
        group_id: groupId,
        author: myUid,
        text,
        reply_to: replyingTo?.id ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error sending group message:", error);
      dispatch(addSnack({ title: "Az üzenet küldése nem sikerült." }));
    } else if (data) {
      loadProfiles([myUid]);
      setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [data, ...prev]));
      dispatch(clearDraftMessage({ chatId: chatKey }));
      setReplyingTo(null);
    }

    setSending(false);
  };

  const deleteMessage = useCallback(async (message: GroupChatMessage) => {
    const { error } = await supabase.from("group_chat_messages").delete().eq("id", message.id);
    if (error) {
      console.error("Error deleting group message:", error);
      return;
    }
    setMessages((prev) => prev.filter((m) => m.id !== message.id));
  }, []);

  // Shown right away, put back if the server says no.
  const toggleHeart = useCallback(
    async (message: GroupChatMessage) => {
      if (!myUid || !groupId) return;
      if (!isMember) {
        dispatch(addSnack({ title: "Csatlakozz a csoporthoz, hogy szívecskét adhass!" }));
        return;
      }

      if (hearts.get(message.id)?.has(myUid)) {
        removeHeart(message.id, myUid);
        const { error } = await supabase
          .from("group_chat_message_hearts")
          .delete()
          .eq("message_id", message.id)
          .eq("user_id", myUid);
        if (error) {
          console.error("Error removing heart:", error);
          addHeart(message.id, myUid);
        }
      } else {
        addHeart(message.id, myUid);
        const { error } = await supabase
          .from("group_chat_message_hearts")
          .insert({ message_id: message.id, user_id: myUid, group_id: groupId });
        if (error) {
          console.error("Error adding heart:", error);
          removeHeart(message.id, myUid);
        }
      }
    },
    [myUid, groupId, isMember, hearts, addHeart, removeHeart, dispatch],
  );

  const displayMessages = useMemo(
    () => messages.filter((m) => !blockedIds.has(m.author)),
    [messages, blockedIds],
  );

  const replyTarget = useReplyTargets("group_chat_messages", messages);
  const { highlightedId, jumpTo, onScrollToIndexFailed } = useJumpToMessage({
    listRef,
    items: displayMessages,
    loadThrough,
  });

  // Hearts from blocked users are not counted, same as their messages.
  const heartCountOf = useCallback(
    (messageId: number) => {
      let count = 0;
      hearts.get(messageId)?.forEach((userId) => !blockedIds.has(userId) && count++);
      return count;
    },
    [hearts, blockedIds],
  );

  const nameOf = useCallback(
    (authorId: string) => {
      if (authorId === myUid) return "Te";
      const p = profiles[authorId];
      return p?.full_name || p?.username || "Ismeretlen";
    },
    [profiles, myUid],
  );

  if (groupNotFound) {
    return (
      <ErrorScreen
        icon="account-group"
        title="Nem található"
        text="Ez a csoport nem létezik."
      />
    );
  }

  if (loading || isMember === null) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoiding}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 34}
    >
      <ThemedView style={styles.container}>
        <FlatList
          ref={listRef}
          data={displayMessages}
          inverted
          keyExtractor={(item) => item.id.toString()}
          onScrollToIndexFailed={onScrollToIndexFailed}
          renderItem={({ item, index }) => {
            const { message: replyToMessage, deleted: replyToDeleted } = replyTarget(item.reply_to);
            const heartCount = heartCountOf(item.id);
            const older = displayMessages[index + 1] ?? null;

            const showDateSeparator =
              !older || !isSameCalendarDay(item.created_at, older.created_at);
            const showLargeGap =
              !showDateSeparator &&
              !!older &&
              new Date(item.created_at).getTime() - new Date(older.created_at).getTime() >
                LARGE_GAP_THRESHOLD_MS;
            // Name + picture on the first message of a run by the same author.
            const showAuthor =
              showDateSeparator || showLargeGap || !older || older.author !== item.author;

            return (
              <View style={showLargeGap ? styles.largeGap : undefined}>
                {showDateSeparator && <DateSeparator date={item.created_at} />}
                <MessageItem
                  message={item}
                  selected={selectedMessageId === item.id}
                  onPress={() =>
                    setSelectedMessageId((prev) => (prev === item.id ? null : item.id))
                  }
                  hearted={heartCount > 0}
                  heartCount={heartCount}
                  onToggleHeart={() => toggleHeart(item)}
                  onLongPress={item.author === myUid ? () => setActionsMessage(item) : undefined}
                  onSwipeReply={isMember ? () => setReplyingTo(item) : undefined}
                  replyToMessage={replyToMessage}
                  replyToDeleted={replyToDeleted}
                  onReplyPress={replyToMessage ? () => jumpTo(replyToMessage) : undefined}
                  highlighted={highlightedId === item.id}
                  otherUserName={replyToMessage ? nameOf(replyToMessage.author) : undefined}
                  author={profiles[item.author] ?? null}
                  showAuthor={showAuthor}
                />
              </View>
            );
          }}
          contentContainerStyle={styles.messagesList}
          keyboardShouldPersistTaps="handled"
          onEndReached={loadOlderMessages}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingOlder ? <ActivityIndicator style={styles.loadingOlder} /> : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text variant="bodyLarge" style={{ textAlign: "center" }}>
                Még nincs üzenet a csoportban. Írj elsőként!
              </Text>
            </View>
          }
        />

        {isMember ? (
          <>
            {replyingTo && (
              <ReplyPreview
                message={replyingTo}
                authorLabel={replyingTo.author === myUid ? "magadnak" : nameOf(replyingTo.author)}
                onCancel={() => setReplyingTo(null)}
              />
            )}
            <MessageInput
              value={draft}
              onChangeText={setDraft}
              onSend={sendMessage}
              image={null}
              onImageChange={() => {}}
              allowImage={false}
              disabled={sending}
            />
          </>
        ) : (
          <View style={styles.joinContainer}>
            <Text
              variant="bodySmall"
              style={[styles.joinHint, { color: theme.colors.onSurfaceVariant }]}
            >
              Csatlakozz a csoporthoz, hogy te is írhass!
            </Text>
            <Button
              mode="contained"
              icon="account-plus"
              onPress={join}
              loading={joining}
              disabled={joining}
            >
              Csatlakozom
            </Button>
          </View>
        )}
      </ThemedView>

      <Portal>
        <Modal
          visible={showMembers}
          onDismiss={() => setShowMembers(false)}
          contentContainerStyle={[styles.membersModal, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleMedium" style={styles.membersTitle}>
            Tagok ({memberCount})
          </Text>
          {members === null ? (
            <ActivityIndicator style={styles.loadingOlder} />
          ) : (
            <FlatList
              data={members}
              keyExtractor={(m) => m.user_id}
              ListEmptyComponent={
                <Text variant="bodyMedium" style={styles.membersEmpty}>
                  Még senki nem csatlakozott.
                </Text>
              }
              renderItem={({ item }) => (
                <Link href={`/user/${item.user_id}`} asChild onPress={() => setShowMembers(false)}>
                  <List.Item
                    title={item.profiles?.full_name || item.profiles?.username || "Ismeretlen"}
                    description={`Csatlakozott: ${new Date(item.joined_at).toLocaleDateString("hu-HU")}`}
                    left={() => (
                      <ProfileImage
                        uid={item.user_id}
                        avatar_url={item.profiles?.avatar_url}
                        size={40}
                        style={styles.memberAvatar}
                      />
                    )}
                  />
                </Link>
              )}
            />
          )}
        </Modal>
      </Portal>

      <MessageActionsSheet
        visible={!!actionsMessage}
        onDismiss={() => setActionsMessage(null)}
        onDelete={() => {
          if (actionsMessage) deleteMessage(actionsMessage);
          setActionsMessage(null);
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flexShrink: 1,
  },
  groupIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  messagesList: {
    flexGrow: 1,
    paddingVertical: 8,
  },
  largeGap: {
    marginTop: Spacing.lg,
  },
  loadingOlder: {
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  joinContainer: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  joinHint: {
    textAlign: "center",
  },
  membersModal: {
    margin: Spacing.lg,
    padding: Spacing.md,
    borderRadius: 12,
    maxHeight: "80%",
  },
  membersTitle: {
    marginBottom: Spacing.sm,
  },
  membersEmpty: {
    padding: Spacing.md,
    textAlign: "center",
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginLeft: 8,
  },
});
