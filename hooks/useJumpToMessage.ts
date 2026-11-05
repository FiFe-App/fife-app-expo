import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import { FlatList } from "react-native";

type ChatMessage = { id: number; created_at: string };

const HIGHLIGHT_MS = 1600;

/**
 * Scrolls a chat list to a message and briefly highlights it — used when a
 * quoted message is tapped.
 *
 * If the message is older than what is loaded, `loadThrough` is asked to load
 * everything back to it first; the scroll then happens once it shows up in
 * `items`. Rows have different heights, so a scrollToIndex far outside the
 * rendered window fails at first: the list is moved to an estimate and the
 * scroll retried.
 */
export function useJumpToMessage<T extends ChatMessage>({
  listRef,
  items,
  loadThrough,
}: {
  listRef: RefObject<FlatList<T> | null>;
  items: T[];
  loadThrough: (createdAt: string) => Promise<void>;
}) {
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const pendingId = useRef<number | null>(null);
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (highlightTimer.current) clearTimeout(highlightTimer.current);
      if (retryTimer.current) clearTimeout(retryTimer.current);
    },
    [],
  );

  const scrollTo = useCallback(
    (index: number, id: number) => {
      listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
      setHighlightedId(id);
      if (highlightTimer.current) clearTimeout(highlightTimer.current);
      highlightTimer.current = setTimeout(() => setHighlightedId(null), HIGHLIGHT_MS);
    },
    [listRef],
  );

  // A jump that had to load older messages first lands here once they are in.
  useEffect(() => {
    if (pendingId.current == null) return;
    const index = items.findIndex((m) => m.id === pendingId.current);
    if (index === -1) return;
    const id = pendingId.current;
    pendingId.current = null;
    scrollTo(index, id);
  }, [items, scrollTo]);

  const jumpTo = useCallback(
    async (message: T) => {
      const index = items.findIndex((m) => m.id === message.id);
      if (index !== -1) {
        scrollTo(index, message.id);
        return;
      }
      pendingId.current = message.id;
      await loadThrough(message.created_at);
    },
    [items, scrollTo, loadThrough],
  );

  const onScrollToIndexFailed = useCallback(
    (info: { index: number; averageItemLength: number }) => {
      listRef.current?.scrollToOffset({
        offset: info.averageItemLength * info.index,
        animated: false,
      });
      if (retryTimer.current) clearTimeout(retryTimer.current);
      retryTimer.current = setTimeout(() => {
        listRef.current?.scrollToIndex({
          index: info.index,
          animated: true,
          viewPosition: 0.5,
        });
      }, 100);
    },
    [listRef],
  );

  return { highlightedId, jumpTo, onScrollToIndexFailed };
}
