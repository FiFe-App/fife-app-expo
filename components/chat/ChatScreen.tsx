import { ThemedView } from "@/components/ThemedView";
import { Tables } from "@/database.types";
import { supabase } from "@/lib/supabase/supabase";
import { RootState } from "@/redux/store";
import { Link, useFocusEffect, useGlobalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import ProfileImage from "@/components/ProfileImage";
import { useNavigation } from "@react-navigation/native";
import { ActivityIndicator, Portal, Text } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { MessageItem } from "./MessageItem";
import { MessageInput } from "./MessageInput";
import { RealtimeChannel } from "@supabase/supabase-js";
import { clearDraftMessage, setDraftMessage, setLastReadAt } from "@/redux/reducers/chatReducer";
import { MyAppbar } from "../MyAppBar";
import { MessagingDisabledCard } from "./MessagingDisabledCard";
import { setMessagingEnabled } from "@/redux/reducers/userReducer";
import { setOptions, clearOptions } from "@/redux/reducers/infoReducer";
import ReportProfileModal from "@/components/user/ReportProfileModal";
import { MessageActionsSheet } from "./MessageActionsSheet";
import { ReplyPreview } from "./ReplyPreview";

type Message = Tables<"messages">;

const PAGE_SIZE = 30;
const NEAR_BOTTOM_THRESHOLD = 80;
const TOP_LOAD_THRESHOLD = 100;

export default function ChatScreen() {
  const dispatch = useDispatch();
  const [selectedMessageId, setSelectedMessageId] = useState<number | null>(null);
  const { uid: otherUid } = useGlobalSearchParams<{ uid: string }>();
  const { uid: myUid, messagingEnabled: myMessagingEnabledFromRedux } = useSelector((state: RootState) => state.user);
  const draft = useSelector((state: RootState) =>
    otherUid ? state.chat.drafts[otherUid] ?? "" : ""
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<Tables<"profiles"> | null>(null);
  const hasMessagingEnabled = myMessagingEnabledFromRedux ?? false;
  const [otherHasMessagingEnabled, setOtherHasMessagingEnabled] = useState(false);
  const [checkingMessaging, setCheckingMessaging] = useState(true);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [oldestLoadedCreatedAt, setOldestLoadedCreatedAt] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [actionsMessage, setActionsMessage] = useState<Message | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const mountId = useRef(Date.now()).current;
  const flatListRef = useRef<FlatList>(null);
  const isNearBottomRef = useRef(true);
  const initialScrollDoneRef = useRef(false);
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      if (!otherUid || !myUid) return;
      const currentMyUid = myUid;
      const currentOtherUid = otherUid;

      // Check if both users have MESSAGE contact enabled
      const checkMessaging = async () => {
        // Check current user's MESSAGE contact
        const { data: myMessageContact } = await supabase
          .from("contacts")
          .select("*")
          .eq("author", currentMyUid)
          .eq("type", "MESSAGE")
          .maybeSingle();

        // Check other user's MESSAGE contact
        const { data: otherMessageContact } = await supabase
          .from("contacts")
          .select("*")
          .eq("author", currentOtherUid)
          .eq("type", "MESSAGE")
          .maybeSingle();

        const myMessagingEnabled = !!(myMessageContact && myMessageContact.data);
        const otherMessagingEnabled = !!(otherMessageContact && otherMessageContact.data);

        dispatch(setMessagingEnabled(myMessagingEnabled));
        setOtherHasMessagingEnabled(otherMessagingEnabled);
        setCheckingMessaging(false);
      };

      checkMessaging();

      supabase
        .from("profiles")
        .select("*")
        .eq("id", currentOtherUid)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error("Error loading profile:", error);
            return;
          }
          setOtherUser(data);
        });
      navigation.setOptions({ header: () => <MyAppbar center={
        otherUser && currentOtherUid && (
          <Link href={`/user/${currentOtherUid}`} style={{width:"100%",textAlign:"center"}}>
            <View style={styles.profileHeaderContent}>
              <ProfileImage
                uid={otherUser.id}
                avatar_url={otherUser.avatar_url}
                size={36}
                style={styles.profileImage}
              />
              <Text variant="titleLarge" style={styles.profileName} numberOfLines={1}>
                {otherUser.full_name || otherUser.username}
              </Text>
            </View>
          </Link>
        )} style={{ elevation: 0, shadowOpacity: 0, borderBottomWidth: 0 }} /> });

      dispatch(
        setOptions([
          {
            icon: "alert-octagon",
            onPress: () => setShowReportModal(true),
            title: "Jelentés",
          },
        ]),
      );

      return () => {
        dispatch(clearOptions());
      };
    }, [otherUid, myUid, otherUser, navigation, dispatch]),
  );

  // Load latest page of messages
  const loadMessages = useCallback(async () => {
    if (!myUid || !otherUid) return;

    // Note: myUid and otherUid are safe to interpolate as they come from authenticated
    // Redux state and route params. Supabase's query builder handles the escaping.
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(`and(author.eq.${myUid},to.eq.${otherUid}),and(author.eq.${otherUid},to.eq.${myUid})`)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (error) {
      console.error("Error loading messages:", error);
      return;
    }

    const page = (data || []).slice().reverse();
    initialScrollDoneRef.current = false;
    setMessages(page);
    setHasMoreOlder((data || []).length === PAGE_SIZE);
    setOldestLoadedCreatedAt(page.length > 0 ? page[0].created_at : null);

    const realMessages = page.filter((m) => !m.text.startsWith("heart-"));
    if (otherUid) {
      const lastReadAt = realMessages.length > 0
        ? realMessages[realMessages.length - 1].created_at
        : new Date().toISOString();
      dispatch(setLastReadAt({ chatId: otherUid, lastReadAt }));
    }
    setLoading(false);
  }, [myUid, otherUid, dispatch]);

  // Load an older page of messages when scrolling up
  const loadOlderMessages = useCallback(async () => {
    if (!myUid || !otherUid || loadingOlder || !hasMoreOlder || !oldestLoadedCreatedAt) return;
    setLoadingOlder(true);

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(`and(author.eq.${myUid},to.eq.${otherUid}),and(author.eq.${otherUid},to.eq.${myUid})`)
      .lt("created_at", oldestLoadedCreatedAt)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (error) {
      console.error("Error loading older messages:", error);
      setLoadingOlder(false);
      return;
    }

    const olderPage = (data || []).slice().reverse();
    setMessages((prev) => [...olderPage, ...prev]);
    setHasMoreOlder((data || []).length === PAGE_SIZE);
    if (olderPage.length > 0) setOldestLoadedCreatedAt(olderPage[0].created_at);
    setLoadingOlder(false);
  }, [myUid, otherUid, loadingOlder, hasMoreOlder, oldestLoadedCreatedAt]);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      isNearBottomRef.current =
        contentOffset.y + layoutMeasurement.height >= contentSize.height - NEAR_BOTTOM_THRESHOLD;

      if (contentOffset.y < TOP_LOAD_THRESHOLD && hasMoreOlder && !loadingOlder) {
        loadOlderMessages();
      }
    },
    [hasMoreOlder, loadingOlder, loadOlderMessages],
  );

  // Scroll to bottom once, right after the initial page has rendered
  useEffect(() => {
    if (!loading && !initialScrollDoneRef.current && messages.length > 0) {
      initialScrollDoneRef.current = true;
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      });
    }
  }, [loading, messages.length]);

  // Keep the latest messages visible above the keyboard when it opens
  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const sub = Keyboard.addListener(showEvent, () => {
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      });
    });
    return () => sub.remove();
  }, []);

  // Set up realtime subscription
  useEffect(() => {
    if (!myUid || !otherUid || !hasMessagingEnabled || !otherHasMessagingEnabled) return;

    loadMessages();

    // Subscribe to new messages - listen to all messages and filter client-side
    // because Supabase realtime filters don't support complex OR conditions well
    const channel = supabase
      .channel(`messages:${myUid}:${otherUid}:${mountId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMessage = payload.new as Message;
          // Only add if it's relevant to this conversation
          if (
            (newMessage.author === myUid && newMessage.to === otherUid) ||
            (newMessage.author === otherUid && newMessage.to === myUid)
          ) {
            const isHeart = newMessage.text.startsWith("heart-");

            setMessages((prev) => {
              if (prev.some((m) => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });

            if (!isHeart && newMessage.author === otherUid && newMessage.to === myUid && otherUid) {
              dispatch(setLastReadAt({ chatId: otherUid, lastReadAt: newMessage.created_at }));
            }

            if (!isHeart && newMessage.author === otherUid && isNearBottomRef.current) {
              requestAnimationFrame(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
              });
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const oldId = (payload.old as { id?: number } | null)?.id;
          if (oldId == null) return;
          setMessages((prev) => prev.filter((m) => m.id !== oldId));
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [myUid, otherUid, hasMessagingEnabled, otherHasMessagingEnabled, loadMessages, dispatch, mountId]);

  const setDraft = useCallback(
    (text: string) => {
      if (!otherUid) return;
      dispatch(setDraftMessage({ chatId: otherUid, draft: text }));
    },
    [dispatch, otherUid],
  );

  const clearDraft = useCallback(() => {
    if (!otherUid) return;
    dispatch(clearDraftMessage({ chatId: otherUid }));
  }, [dispatch, otherUid]);

  const sendMessage = async (text: string) => {
    if (!myUid || !otherUid || sending || !hasMessagingEnabled || !otherHasMessagingEnabled) return;

    setSending(true);

    const { data, error } = await supabase.from("messages").insert({
      author: myUid,
      to: otherUid,
      text,
      reply_to: replyingTo?.id ?? null,
    }).select().single();

    if (error) {
      console.error("Error sending message:", error);
    } else if (data) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev;
        return [...prev, data];
      });
      clearDraft();
      setReplyingTo(null);
      isNearBottomRef.current = true;
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      });
    }

    setSending(false);
  };

  const toggleHeart = useCallback(
    async (message: Message) => {
      if (!myUid || !otherUid) return;
      const heartText = `heart-${message.id}`;
      const myHeartRow = messages.find((m) => m.author === myUid && m.text === heartText);

      if (myHeartRow) {
        const { error } = await supabase.from("messages").delete().eq("id", myHeartRow.id);
        if (error) {
          console.error("Error removing heart:", error);
          return;
        }
        setMessages((prev) => prev.filter((m) => m.id !== myHeartRow.id));
      } else {
        const { data, error } = await supabase
          .from("messages")
          .insert({
            author: myUid,
            to: otherUid,
            text: heartText,
            created_at: message.created_at,
          })
          .select()
          .single();

        if (error) {
          console.error("Error adding heart:", error);
          return;
        }
        if (data) {
          setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data]));
        }
      }
    },
    [myUid, otherUid, messages],
  );

  const deleteMessage = useCallback(async (message: Message) => {
    const { error } = await supabase.from("messages").delete().eq("id", message.id);
    if (error) {
      console.error("Error deleting message:", error);
      return;
    }
    setMessages((prev) => prev.filter((m) => m.id !== message.id));
  }, []);

  const displayMessages = useMemo(
    () => messages.filter((m) => !m.text.startsWith("heart-")),
    [messages],
  );

  const heartedTexts = useMemo(() => {
    const set = new Set<string>();
    messages.forEach((m) => {
      if (m.text.startsWith("heart-")) set.add(m.text);
    });
    return set;
  }, [messages]);

  const messageById = useMemo(() => {
    const map = new Map<number, Message>();
    messages.forEach((m) => map.set(m.id, m));
    return map;
  }, [messages]);

  const otherUserLabel = otherUser?.full_name || otherUser?.username || "";

  if (checkingMessaging) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (!hasMessagingEnabled || !otherHasMessagingEnabled) {
    return (
      <ThemedView style={styles.container}>
        <MessagingDisabledCard
          myMessagingEnabled={hasMessagingEnabled}
          otherMessagingEnabled={otherHasMessagingEnabled}
          onEnabled={() => {
            // Re-check both users' messaging status
            (async () => {
              if (!myUid || !otherUid) return;
              const currentMyUid = myUid;
              const currentOtherUid = otherUid;

              const { data: myMessageContact } = await supabase
                .from("contacts")
                .select("*")
                .eq("author", currentMyUid)
                .eq("type", "MESSAGE")
                .maybeSingle();

              const { data: otherMessageContact } = await supabase
                .from("contacts")
                .select("*")
                .eq("author", currentOtherUid)
                .eq("type", "MESSAGE")
                .maybeSingle();

              const myMessagingEnabled = !!(myMessageContact && myMessageContact.data);
              const otherMessagingEnabled = !!(otherMessageContact && otherMessageContact.data);

              dispatch(setMessagingEnabled(myMessagingEnabled));
              setOtherHasMessagingEnabled(otherMessagingEnabled);

              if (myMessagingEnabled && otherMessagingEnabled) {
                loadMessages();
              }
            })();
          }}
        />
      </ThemedView>
    );
  }

  if (loading) {
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
          ref={flatListRef}
          data={displayMessages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            const replyToMessage = item.reply_to ? messageById.get(item.reply_to) ?? null : null;
            const replyToDeleted = !!item.reply_to && !replyToMessage;
            return (
              <MessageItem
                message={item}
                selected={selectedMessageId === item.id}
                onPress={() =>
                  setSelectedMessageId((prev) => (prev === item.id ? null : item.id))
                }
                hearted={heartedTexts.has(`heart-${item.id}`)}
                onToggleHeart={() => toggleHeart(item)}
                onLongPress={() => setActionsMessage(item)}
                replyToMessage={replyToMessage}
                replyToDeleted={replyToDeleted}
                otherUserName={otherUserLabel || undefined}
              />
            );
          }}
          contentContainerStyle={styles.messagesList}
          keyboardShouldPersistTaps="handled"
          onScroll={handleScroll}
          scrollEventThrottle={16}
          maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
          ListHeaderComponent={
            loadingOlder ? <ActivityIndicator style={styles.loadingOlder} /> : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text variant="bodyLarge" style={{textAlign:"center"}}>
                {otherUser
                  ? `Te és ${otherUser.full_name} még nem beszélgettetek az appon belül!`
                  : "Nincs még üzenet"}
              </Text>
            </View>
          }
        />

        {replyingTo && (
          <ReplyPreview
            message={replyingTo}
            authorLabel={replyingTo.author === myUid ? "magadnak" : otherUserLabel}
            onCancel={() => setReplyingTo(null)}
          />
        )}

        <MessageInput
          value={draft}
          onChangeText={setDraft}
          onSend={sendMessage}
          disabled={sending || !hasMessagingEnabled || !otherHasMessagingEnabled}
        />
      </ThemedView>

      {!!otherUid && (
        <Portal>
          <ReportProfileModal
            show={showReportModal}
            setShow={setShowReportModal}
            profileId={otherUid}
            profileName={otherUserLabel}
          />
        </Portal>
      )}

      <MessageActionsSheet
        visible={!!actionsMessage}
        onDismiss={() => setActionsMessage(null)}
        isOwn={actionsMessage?.author === myUid}
        onReply={() => {
          setReplyingTo(actionsMessage);
          setActionsMessage(null);
        }}
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
  header: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
    elevation: 2,
    zIndex: 10,
  },
  profileHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex:1,
    width:"100%",
    marginLeft: 8,
  },
  profileImage: {
    marginRight: 10,
    width: 35,
    height:35,
    borderRadius: 8
  },
  profileName: {
    flexShrink: 1,
    fontFamily: "Piazzolla-Regular",
    fontWeight: "bold",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  messagesList: {
    flexGrow: 1,
    paddingVertical: 8,
  },
  loadingOlder: {
    paddingVertical: 8,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
});
