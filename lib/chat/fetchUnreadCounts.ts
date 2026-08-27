import { computeUnreadCounts } from "@/lib/functions/computeUnreadCounts";
import { supabase } from "@/lib/supabase/supabase";

/**
 * Loads every message sent to `uid` and reduces it to a per-chat unread count
 * against the given `lastReadAt` map. Shared by the app-startup fetch (so the
 * bottom nav badge is right before the user ever opens a chat screen) and the
 * home screen's own refresh-on-focus.
 */
export async function fetchUnreadCounts(uid: string, lastReadAt: Record<string, string>) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("to", uid);

  if (error) {
    console.error("Error loading unread messages:", error);
    return null;
  }

  return computeUnreadCounts(data || [], uid, lastReadAt);
}
