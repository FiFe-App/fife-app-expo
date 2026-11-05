import { supabase } from "@/lib/supabase/supabase";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type ChatMessage = { id: number; reply_to: number | null };

/**
 * The messages that loaded messages quote.
 *
 * A reply often quotes something older than the pages loaded so far. Those
 * originals are fetched by id, so the quote can be shown — and jumped to —
 * instead of looking like a deleted message. `reply_to` is set to NULL when the
 * original is deleted, so an id that comes back empty really is gone (or is
 * hidden from this user by RLS).
 */
export function useReplyTargets<T extends ChatMessage>(
  table: "messages" | "group_chat_messages",
  messages: T[],
) {
  const [fetched, setFetched] = useState<Map<number, T>>(new Map());
  const [gone, setGone] = useState<Set<number>>(new Set());
  const requested = useRef(new Set<number>());

  const loaded = useMemo(() => {
    const map = new Map<number, T>();
    messages.forEach((m) => map.set(m.id, m));
    return map;
  }, [messages]);

  useEffect(() => {
    const ids = [
      ...new Set(
        messages
          .map((m) => m.reply_to)
          .filter(
            (id): id is number =>
              id != null && !loaded.has(id) && !requested.current.has(id),
          ),
      ),
    ];
    if (ids.length === 0) return;
    ids.forEach((id) => requested.current.add(id));

    supabase
      .from(table)
      .select("*")
      .in("id", ids)
      .then(({ data, error }) => {
        if (error) {
          console.error("Error loading quoted messages:", error);
          ids.forEach((id) => requested.current.delete(id));
          return;
        }
        const rows = (data ?? []) as unknown as T[];
        const found = new Set(rows.map((m) => m.id));
        setFetched((prev) => {
          const next = new Map(prev);
          rows.forEach((m) => next.set(m.id, m));
          return next;
        });
        setGone((prev) => {
          const next = new Set(prev);
          ids.forEach((id) => !found.has(id) && next.add(id));
          return next;
        });
      });
  }, [messages, loaded, table]);

  return useCallback(
    (id: number | null) => {
      if (id == null) return { message: null, deleted: false };
      const message = loaded.get(id) ?? fetched.get(id) ?? null;
      return { message, deleted: !message && gone.has(id) };
    },
    [loaded, fetched, gone],
  );
}
