import { Tables } from "@/database.types";

type Message = Tables<"messages">;

const EPOCH = "1970-01-01T00:00:00Z";

// Counts, per conversation partner, how many messages sent to me arrived after
// that conversation's lastReadAt. Heart reactions are stored as message rows
// but aren't real messages, so they're excluded.
export function computeUnreadCounts(
  messages: Message[],
  myUid: string,
  lastReadAt: Record<string, string>,
): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const message of messages) {
    if (message.author === myUid) continue;
    if (message.text.startsWith("heart-")) continue;

    const chatId = message.author;
    const readAt = lastReadAt[chatId] ?? EPOCH;
    if (message.created_at > readAt) {
      counts[chatId] = (counts[chatId] ?? 0) + 1;
    }
  }

  return counts;
}
