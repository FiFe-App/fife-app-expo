import { ThemedView } from "@/components/ThemedView";
import { Tables } from "@/database.types";
import { supabase } from "@/lib/supabase/supabase";
import { RootState } from "@/redux/store";
import { useGlobalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, View, StyleSheet } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";
import { useSelector } from "react-redux";
import { MessageItem } from "./MessageItem";
import { MessageInput } from "./MessageInput";
import { RealtimeChannel } from "@supabase/supabase-js";

type Message = Tables<"messages">;

export default function ChatScreen() {
  const { uid: otherUid } = useGlobalSearchParams<{ uid: string }>();
  const { uid: myUid } = useSelector((state: RootState) => state.user);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<Tables<"profiles"> | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Load other user's profile
  useEffect(() => {
    if (!otherUid) return;

    supabase
      .from("profiles")
      .select("*")
      .eq("id", otherUid)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error("Error loading profile:", error);
          return;
        }
        setOtherUser(data);
      });
  }, [otherUid]);

  // Load messages
  const loadMessages = useCallback(async () => {
    if (!myUid || !otherUid) return;

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
    setLoading(false);

    // Scroll to bottom after loading
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: false });
    }, 100);
  }, [myUid, otherUid]);

  // Set up realtime subscription
  useEffect(() => {
    if (!myUid || !otherUid) return;

    loadMessages();

    // Subscribe to new messages - listen to all messages and filter client-side
    // because Supabase realtime filters don't support complex OR conditions well
    const channel = supabase
      .channel("messages_channel")
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
            setMessages((prev) => [...prev, newMessage]);
            // Scroll to bottom when new message arrives
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
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
  }, [myUid, otherUid, loadMessages]);

  const sendMessage = async (text: string) => {
    if (!myUid || !otherUid || sending) return;

    setSending(true);

    const { error } = await supabase.from("messages").insert({
      author: myUid,
      to: otherUid,
      text,
    });

    if (error) {
      console.error("Error sending message:", error);
    }

    setSending(false);
  };

  if (loading) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <MessageItem message={item} />}
        contentContainerStyle={styles.messagesList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge">
              {otherUser
                ? `Kezdj beszélgetést ${otherUser.full_name} felhasználóval!`
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
      <MessageInput onSend={sendMessage} disabled={sending} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
});
