import { ThemedView } from "@/components/ThemedView";
import { Tables } from "@/database.types";
import { computeUnreadCounts } from "@/lib/functions/computeUnreadCounts";
import { supabase } from "@/lib/supabase/supabase";
import { setUnreadCounts } from "@/redux/reducers/chatReducer";
import { RootState } from "@/redux/store";
import React, { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, View, StyleSheet } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { ChatListItem } from "./ChatListItem";
import { useFocusEffect } from "expo-router";
import { MessagingDisabledCard } from "./MessagingDisabledCard";

type Message = Tables<"messages">;
type Profile = Tables<"profiles">;

interface ChatInfo {
  otherUser: Profile;
  lastMessage: Message | null;
}

export default function ChatList() {
  const dispatch = useDispatch();
  const { uid: myUid, messagingEnabled } = useSelector((state: RootState) => state.user);
  const { lastReadAt, unreadCounts } = useSelector((state: RootState) => state.chat);
  const [chats, setChats] = useState<ChatInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadChats = useCallback(async () => {
    if (!myUid) return;

    try {
      // Get all messages involving the current user
      const { data: messages, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .or(`author.eq.${myUid},to.eq.${myUid}`)
        .order("created_at", { ascending: false });

      if (messagesError) {
        console.error("Error loading messages:", messagesError);
        return;
      }

      if (!messages || messages.length === 0) {
        setChats([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Get unique user IDs from messages (heart reactions aren't real messages
      // and shouldn't show up as a conversation's last message)
      const realMessages = messages.filter((msg) => !msg.text.startsWith("heart-"));
      const userIds = new Set<string>();
      const lastMessageMap = new Map<string, Message>();

      realMessages.forEach((msg) => {
        const otherUserId = msg.author === myUid ? msg.to : msg.author;
        if (otherUserId) {
          userIds.add(otherUserId);
          if (!lastMessageMap.has(otherUserId)) {
            lastMessageMap.set(otherUserId, msg);
          }
        }
      });

      dispatch(setUnreadCounts(computeUnreadCounts(messages, myUid, lastReadAt)));

      // Load profiles for all users
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", Array.from(userIds));

      if (profilesError) {
        console.error("Error loading profiles:", profilesError);
        return;
      }

      // Combine profiles with their last messages
      const chatInfos: ChatInfo[] = (profiles || [])
        .map((profile) => ({
          otherUser: profile,
          lastMessage: lastMessageMap.get(profile.id) || null,
        }))
        .sort((a, b) => {
          if (!a.lastMessage) return 1;
          if (!b.lastMessage) return -1;
          return (
            new Date(b.lastMessage.created_at).getTime() -
            new Date(a.lastMessage.created_at).getTime()
          );
        });

      setChats(chatInfos);
    } catch (error) {
      console.error("Error in loadChats:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [myUid, lastReadAt, dispatch]);

  useFocusEffect(
    useCallback(() => {
      loadChats();
    }, [loadChats])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadChats();
  };

  if (loading) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (!messagingEnabled) {
    return (
      <ThemedView style={styles.container}>
        <MessagingDisabledCard
          myMessagingEnabled={false}
          onEnabled={() => {
            loadChats();
          }}
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.otherUser.id}
        renderItem={({ item }) => (
          <ChatListItem
            otherUser={item.otherUser}
            lastMessage={item.lastMessage}
            unreadCount={unreadCounts[item.otherUser.id] ?? 0}
          />
        )}
        contentContainerStyle={chats.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyTextContainer}>
            <Text variant="bodyLarge">Nincs még beszélgetés</Text>
            <Text
              variant="bodyMedium"
              style={{ textAlign: "center", marginTop: 8 }}
            >
              Keress meg valakit és kezdj el beszélgetni!
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
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
  listContent: {
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTextContainer: {
    padding: 20,
    alignItems: "center",
  },
});
