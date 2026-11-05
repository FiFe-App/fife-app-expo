import { Tables } from "@/database.types";
import { supabase } from "@/lib/supabase/supabase";

export type GroupChat = Tables<"group_chats">;
export type GroupChatMessage = Tables<"group_chat_messages">;
export type GroupChatMember = Tables<"group_chat_members">;

/** Seeded in supabase/migrations/20260925120000_add_group_chats.sql. */
export const FIFE_GROUP_CHAT_ID = "6f1e5c2a-0b7d-4c1e-9a53-f1fe00c4a700";

/**
 * Group chats share the per-chat drafts / lastReadAt maps with the 1:1 chats,
 * which are keyed by the other user's uid. The prefix keeps the two apart.
 */
export const groupChatKey = (groupId: string) => `group:${groupId}`;

export interface GroupChatSummary {
  group: GroupChat;
  lastMessage: GroupChatMessage | null;
  lastMessageAuthorName: string | null;
  memberCount: number;
  isMember: boolean;
}

/**
 * Everything the chat list needs to show the public groups: the group itself,
 * its latest message (with the author's name for the preview), how many
 * people joined and whether `uid` is one of them.
 */
export async function fetchPublicGroupChats(uid: string): Promise<GroupChatSummary[]> {
  const { data: groups, error } = await supabase
    .from("group_chats")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error loading group chats:", error);
    return [];
  }

  return Promise.all(
    (groups ?? []).map(async (group) => {
      const [lastRes, countRes, memberRes] = await Promise.all([
        supabase
          .from("group_chat_messages")
          .select("*")
          .eq("group_id", group.id)
          .order("created_at", { ascending: false })
          .limit(1),
        supabase
          .from("group_chat_members")
          .select("user_id", { count: "exact", head: true })
          .eq("group_id", group.id),
        supabase
          .from("group_chat_members")
          .select("user_id")
          .eq("group_id", group.id)
          .eq("user_id", uid)
          .limit(1),
      ]);

      const lastMessage = lastRes.data?.[0] ?? null;
      let lastMessageAuthorName: string | null = null;
      if (lastMessage) {
        if (lastMessage.author === uid) {
          lastMessageAuthorName = "Te";
        } else {
          const { data: author } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", lastMessage.author)
            .maybeSingle();
          lastMessageAuthorName = author?.full_name ?? null;
        }
      }

      return {
        group,
        lastMessage,
        lastMessageAuthorName,
        memberCount: countRes.count ?? 0,
        isMember: (memberRes.data?.length ?? 0) > 0,
      };
    }),
  );
}

/** `null` when the check itself failed, so callers don't mistake it for "not a member". */
export async function fetchGroupMembership(
  groupId: string,
  uid: string,
): Promise<boolean | null> {
  const { data, error } = await supabase
    .from("group_chat_members")
    .select("user_id")
    .eq("group_id", groupId)
    .eq("user_id", uid)
    .limit(1);

  if (error) {
    console.error("Error checking group membership:", error);
    return null;
  }
  return (data?.length ?? 0) > 0;
}

export async function joinGroupChat(groupId: string, uid: string): Promise<boolean> {
  // upsert with ignoreDuplicates: joining twice (double tap, two devices) is
  // not an error and must not move the original joined_at.
  const { error } = await supabase
    .from("group_chat_members")
    .upsert(
      { group_id: groupId, user_id: uid },
      { onConflict: "group_id,user_id", ignoreDuplicates: true },
    );

  if (error) {
    console.error("Error joining group chat:", error);
    return false;
  }
  return true;
}

export async function leaveGroupChat(groupId: string, uid: string): Promise<boolean> {
  const { error } = await supabase
    .from("group_chat_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", uid);

  if (error) {
    console.error("Error leaving group chat:", error);
    return false;
  }
  return true;
}

/** Members, newest first, with the profile fields the member list shows. */
export async function fetchGroupMembers(groupId: string) {
  const { data, error } = await supabase
    .from("group_chat_members")
    .select("user_id, joined_at, profiles(id, full_name, username, avatar_url)")
    .eq("group_id", groupId)
    .order("joined_at", { ascending: false });

  if (error) {
    console.error("Error loading group members:", error);
    return null;
  }
  return data ?? [];
}
