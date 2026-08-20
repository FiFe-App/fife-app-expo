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
} from "react-native";
import ProfileImage from "@/components/ProfileImage";
import { useNavigation } from "@react-navigation/native";
import { ActivityIndicator, Portal, Text } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { MessageItem } from "./MessageItem";
import { MessageInput } from "./MessageInput";
import { RealtimeChannel } from "@supabase/supabase-js";
import { clearDraftMessage, setDraftMessage, setLastReadAt } from "@/redux/reducers/chatReducer";
import { addSnack } from "@/redux/reducers/infoReducer";
import getUploadData from "@/lib/functions/getUploadData";
import * as ExpoImagePicker from "expo-image-picker";
import { MyAppbar } from "../MyAppBar";
import { MessagingDisabledCard } from "./MessagingDisabledCard";
import { setMessagingEnabled } from "@/redux/reducers/userReducer";
import { fetchMessagingEnabled } from "@/lib/chat/messagingContact";
import { setOptions, clearOptions } from "@/redux/reducers/infoReducer";
import ReportProfileModal from "@/components/user/ReportProfileModal";
import { MessageActionsSheet } from "./MessageActionsSheet";
import { ReplyPreview } from "./ReplyPreview";
import { DateSeparator } from "./DateSeparator";
import { isSameCalendarDay } from "@/lib/functions/formatChatDate";
import { Spacing } from "@/constants/spacing";

type Message = Tables<"messages">;

const PAGE_SIZE = 30;
const MESSAGE_IMAGES_BUCKET = "messageImages";

/** Messages further apart than this get extra breathing room between them. */
const LARGE_GAP_THRESHOLD_MS = 60 * 60 * 1000;

// Messages are kept newest-first and rendered in an *inverted* FlatList — the
// standard chat pattern. This means the list starts pinned to the bottom for
// free (no scrollToEnd juggling), stays pinned to the bottom as the keyboard
// resizes the viewport, and "load more" naturally becomes onEndReached
// (which fires when scrolling toward the array's end, i.e. the oldest
// messages, since the list is flipped).
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
  const [pendingImage, setPendingImage] =
    useState<ExpoImagePicker.ImagePickerAsset | null>(null);
  const [actionsMessage, setActionsMessage] = useState<Message | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const mountId = useRef(Date.now()).current;
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      if (!otherUid || !myUid) return;
      const currentMyUid = myUid;
      const currentOtherUid = otherUid;

      // Check if both users have MESSAGE contact enabled
      const checkMessaging = async () => {
        const [myMessagingEnabled, otherMessagingEnabled] = await Promise.all([
          fetchMessagingEnabled(currentMyUid),
          fetchMessagingEnabled(currentOtherUid),
        ]);

        // A failed check says nothing about the account, so leave the previous
        // answer standing rather than claiming messaging is switched off.
        if (myMessagingEnabled !== null)
          dispatch(setMessagingEnabled(myMessagingEnabled));
        if (otherMessagingEnabled !== null)
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

  // Load the latest page of messages (newest first)
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

    const page = data || [];
    setMessages(page);
    setHasMoreOlder(page.length === PAGE_SIZE);
    setOldestLoadedCreatedAt(page.length > 0 ? page[page.length - 1].created_at : null);

    if (otherUid) {
      const realMessages = page.filter((m) => !m.text.startsWith("heart-"));
      const lastReadAt = realMessages.length > 0
        ? realMessages[0].created_at
        : new Date().toISOString();
      dispatch(setLastReadAt({ chatId: otherUid, lastReadAt }));
    }
    setLoading(false);
  }, [myUid, otherUid, dispatch]);

  // Load an older page of messages when scrolling toward the top
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

    const olderPage = data || [];
    setMessages((prev) => [...prev, ...olderPage]);
    setHasMoreOlder(olderPage.length === PAGE_SIZE);
    if (olderPage.length > 0) setOldestLoadedCreatedAt(olderPage[olderPage.length - 1].created_at);
    setLoadingOlder(false);
  }, [myUid, otherUid, loadingOlder, hasMoreOlder, oldestLoadedCreatedAt]);

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
              return [newMessage, ...prev];
            });

            if (!isHeart && newMessage.author === otherUid && newMessage.to === myUid && otherUid) {
              dispatch(setLastReadAt({ chatId: otherUid, lastReadAt: newMessage.created_at }));
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

  // Drafts are kept per chat in redux, the attached image is not — drop it when
  // the screen is reused for another conversation.
  useEffect(() => {
    setPendingImage(null);
  }, [otherUid]);

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

  // The image is uploaded before the row is inserted so that the recipient gets
  // the complete message from the realtime INSERT event.
  const uploadImage = async (
    image: ExpoImagePicker.ImagePickerAsset,
  ): Promise<string | null> => {
    if (!myUid) return null;

    const name = image.fileName || image.uri.split("?")[0].split("/").pop() || "";
    const extension = name.includes(".") ? name.split(".").pop() : "jpg";
    const path = `${myUid}/${Date.now()}.${extension}`;

    const uploadData = await getUploadData(image).catch((error) => {
      console.error("Error reading image:", error);
      return null;
    });
    if (!uploadData) return null;

    const { data, error } = await supabase.storage
      .from(MESSAGE_IMAGES_BUCKET)
      .upload(path, uploadData, {
        contentType: image.mimeType || "image/jpeg",
        upsert: false,
      });

    if (error) {
      console.error("Error uploading image:", error);
      return null;
    }
    return data?.path ?? null;
  };

  const sendMessage = async (text: string) => {
    if (!myUid || !otherUid || sending || !hasMessagingEnabled || !otherHasMessagingEnabled) return;
    if (!text && !pendingImage) return;

    setSending(true);

    let imagePath: string | null = null;
    if (pendingImage) {
      imagePath = await uploadImage(pendingImage);
      if (!imagePath) {
        dispatch(addSnack({ title: "A kép feltöltése nem sikerült." }));
        setSending(false);
        return;
      }
    }

    const { data, error } = await supabase.from("messages").insert({
      author: myUid,
      to: otherUid,
      text,
      image: imagePath,
      reply_to: replyingTo?.id ?? null,
    }).select().single();

    if (error) {
      console.error("Error sending message:", error);
      dispatch(addSnack({ title: "Az üzenet küldése nem sikerült." }));
      // Nothing points at the uploaded file anymore, so don't leave it behind.
      if (imagePath)
        await supabase.storage.from(MESSAGE_IMAGES_BUCKET).remove([imagePath]);
    } else if (data) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev;
        return [data, ...prev];
      });
      clearDraft();
      setReplyingTo(null);
      setPendingImage(null);
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
          setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [data, ...prev]));
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
    if (message.image)
      await supabase.storage.from(MESSAGE_IMAGES_BUCKET).remove([message.image]);
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

              const [myMessagingEnabled, otherMessagingEnabled] =
                await Promise.all([
                  fetchMessagingEnabled(myUid),
                  fetchMessagingEnabled(otherUid),
                ]);

              if (myMessagingEnabled !== null)
                dispatch(setMessagingEnabled(myMessagingEnabled));
              if (otherMessagingEnabled !== null)
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
          data={displayMessages}
          inverted
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => {
            const replyToMessage = item.reply_to ? messageById.get(item.reply_to) ?? null : null;
            const replyToDeleted = !!item.reply_to && !replyToMessage;

            // displayMessages is newest-first, so the message *older* than this
            // one — the one rendered directly above it — is the next entry in
            // the array, not the previous one. Cells in an inverted FlatList are
            // flip-corrected individually, so within a cell anything rendered
            // before the message still appears above it.
            const older = displayMessages[index + 1] ?? null;

            // No older message means this is the start of the conversation as
            // far as the list knows, so it always gets a timestamp.
            const showDateSeparator =
              !older || !isSameCalendarDay(item.created_at, older.created_at);

            // The separator already provides a visual break, so only add the
            // extra gap when there isn't one.
            const showLargeGap =
              !showDateSeparator &&
              !!older &&
              new Date(item.created_at).getTime() - new Date(older.created_at).getTime() >
                LARGE_GAP_THRESHOLD_MS;

            return (
              <View style={showLargeGap ? styles.largeGap : undefined}>
                {showDateSeparator && <DateSeparator date={item.created_at} />}
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
              </View>
            );
          }}
          contentContainerStyle={styles.messagesList}
          keyboardShouldPersistTaps="handled"
          onEndReached={loadOlderMessages}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingOlder ? (
              <ActivityIndicator style={[styles.loadingOlder, styles.invertedFix]} />
            ) : null
          }
          ListEmptyComponent={
            <View style={[styles.emptyContainer, styles.invertedFix]}>
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
          image={pendingImage}
          onImageChange={setPendingImage}
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
  largeGap: {
    marginTop: Spacing.lg,
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
  // ListEmptyComponent/ListHeaderComponent/ListFooterComponent aren't routed
  // through the same per-cell flip correction as renderItem, so an inverted
  // FlatList renders them upside down unless corrected manually.
  invertedFix: {
    transform: [{ scaleY: -1 }],
  },
});
