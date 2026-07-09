import { ThemedView } from "@/components/ThemedView";
import { Tables } from "@/database.types";
import { supabase } from "@/lib/supabase/supabase";
import { getUploadableImage } from "@/lib/supabase/imageUpload";
import { RootState } from "@/redux/store";
import * as ExpoImagePicker from "expo-image-picker";
import { Link, useFocusEffect, useGlobalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, View, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import ProfileImage from "@/components/ProfileImage";
import { useNavigation } from "@react-navigation/native";
import { ActivityIndicator, Text } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { MessageItem } from "./MessageItem";
import { MessageInput } from "./MessageInput";
import { RealtimeChannel } from "@supabase/supabase-js";
import { clearDraftMessage, setDraftMessage, setLastReadAt } from "@/redux/reducers/chatReducer";
import { MyAppbar } from "../MyAppBar";
import { MessagingDisabledCard } from "./MessagingDisabledCard";
import { setMessagingEnabled } from "@/redux/reducers/userReducer";

type Message = Tables<"messages">;

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
  const [image, setImage] = useState<ExpoImagePicker.ImagePickerAsset | null>(null);
  const [otherUser, setOtherUser] = useState<Tables<"profiles"> | null>(null);
  const hasMessagingEnabled = myMessagingEnabledFromRedux ?? false;
  const [otherHasMessagingEnabled, setOtherHasMessagingEnabled] = useState(false);
  const [checkingMessaging, setCheckingMessaging] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const mountId = useRef(Date.now()).current;
  const flatListRef = useRef<FlatList>(null);
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
    }, [otherUid, myUid, otherUser, navigation]),
  );

  // Load messages
  const loadMessages = useCallback(async () => {
    if (!myUid || !otherUid) return;

    // Note: myUid and otherUid are safe to interpolate as they come from authenticated
    // Redux state and route params. Supabase's query builder handles the escaping.
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(`and(author.eq.${myUid},to.eq.${otherUid}),and(author.eq.${otherUid},to.eq.${myUid})`)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
      return;
    }

    setMessages(data || []);
    if (otherUid) {
      const lastReadAt = data && data.length > 0 ? data[data.length - 1].created_at : new Date().toISOString();
      dispatch(setLastReadAt({ chatId: otherUid, lastReadAt }));
    }
    setLoading(false);
  }, [myUid, otherUid, dispatch]);

  // Set up realtime subscription
  useEffect(() => {
    if (!myUid || !otherUid || !hasMessagingEnabled || !otherHasMessagingEnabled) return;

    loadMessages();

    // Subscribe to all changes - listen to all messages and filter client-side
    // because Supabase realtime filters don't support complex OR conditions well.
    // We need UPDATE too (not just INSERT): image attachments are uploaded
    // after the message row is inserted, then attached via an update — same
    // two-step insert-then-attach flow as comments.
    const channel = supabase
      .channel(`messages:${myUid}:${otherUid}:${mountId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newMessage = payload.new as Message;
            // Only add if it's relevant to this conversation
            if (
              (newMessage.author === myUid && newMessage.to === otherUid) ||
              (newMessage.author === otherUid && newMessage.to === myUid)
            ) {
              setMessages((prev) => {
                if (prev.some((m) => m.id === newMessage.id)) return prev;
                return [...prev, newMessage];
              });

              if (newMessage.author === otherUid && newMessage.to === myUid && otherUid) {
                dispatch(setLastReadAt({ chatId: otherUid, lastReadAt: newMessage.created_at }));
              }
            }
          } else if (payload.eventType === "UPDATE") {
            const updatedMessage = payload.new as Message;
            if (
              (updatedMessage.author === myUid && updatedMessage.to === otherUid) ||
              (updatedMessage.author === otherUid && updatedMessage.to === myUid)
            ) {
              setMessages((prev) =>
                prev.map((m) => (m.id === updatedMessage.id ? updatedMessage : m)),
              );
            }
          }
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

  const pickImage = async () => {
    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      // Lower than the quality:1 used elsewhere — chat photos are sent much
      // more often than profile/business photos, and a full-resolution
      // photo inflates to a much larger base64 string, which is slow to
      // decode client-side (see getUploadableImage) and slow to upload over
      // mobile data. 0.7 keeps it visually fine while staying small.
      quality: 0.7,
      base64: true,
    }).catch((error) => {
      console.log(error);
    });

    if (result && !result?.canceled) {
      setImage(result.assets[0]);
    } else {
      console.log("cancelled");
    }
  };

  const dismissImage = () => setImage(null);

  // Uploads happen after the message row exists, then attach the storage
  // path via an update — same two-step insert-then-attach flow as comments.
  const uploadMessageImage = async (
    messageId: number,
    pickedImage: ExpoImagePicker.ImagePickerAsset,
  ) => {
    if (!myUid) return;

    const { data: uploadData, fileName, mimeType } = await getUploadableImage(pickedImage);

    const { data: uploaded, error: uploadError } = await supabase.storage
      .from("messageImages")
      .upload(myUid + "/" + fileName, uploadData, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error("Error uploading chat image:", uploadError);
      return;
    }
    if (!uploaded?.path) return;

    const { data: updated, error: updateError } = await supabase
      .from("messages")
      .update({ image: uploaded.path })
      .eq("id", messageId)
      .select()
      .single();

    if (updateError) {
      console.error("Error attaching image to message:", updateError);
      return;
    }
    if (updated) {
      setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    }
  };

  const sendMessage = async (text: string) => {
    if (!myUid || !otherUid || sending || !hasMessagingEnabled || !otherHasMessagingEnabled) return;

    setSending(true);
    const pickedImage = image;

    const { data, error } = await supabase.from("messages").insert({
      author: myUid,
      to: otherUid,
      text,
    }).select().single();

    if (error) {
      console.error("Error sending message:", error);
    } else if (data) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev;
        return [...prev, data];
      });
      clearDraft();

      if (pickedImage) {
        setImage(null);
        await uploadMessageImage(data.id, pickedImage);
      }
    }

    setSending(false);
  };

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
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <MessageItem
              message={item}
              selected={selectedMessageId === item.id}
              onPress={() =>
                setSelectedMessageId((prev) => (prev === item.id ? null : item.id))
              }
            />
          )}
          contentContainerStyle={styles.messagesList}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text variant="bodyLarge" style={{textAlign:"center"}}>
                {otherUser
                  ? `Te és ${otherUser.full_name} még nem beszélgettetek az appon belül!`
                  : "Nincs még üzenet"}
              </Text>
            </View>
          }
          onContentSizeChange={() => {
            // Auto-scroll to bottom when content changes
            if (messages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: true });
            }
          }}
        />

        <MessageInput
          value={draft}
          onChangeText={setDraft}
          onSend={sendMessage}
          disabled={sending || !hasMessagingEnabled || !otherHasMessagingEnabled}
          image={image}
          onPickImage={pickImage}
          onRemoveImage={dismissImage}
        />
      </ThemedView>
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
