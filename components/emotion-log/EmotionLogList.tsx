import { useAppTheme } from "@/assets/theme";
import { ThemedText } from "@/components/ThemedText";
import { BorderRadius } from "@/constants/borderRadius";
import { MODE_SWITCH_CLEARANCE } from "@/constants/layout";
import { Spacing } from "@/constants/spacing";
import { useKeyboardScrollIntoView } from "@/hooks/useKeyboardScrollIntoView";
import { EmotionLogLocal } from "@/redux/store.type";
import { Link } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  View,
} from "react-native";
import { FAB, Icon, Surface, TouchableRipple } from "react-native-paper";
import { getTodayDateString } from "./dates";
import EmotionLogEntry from "./EmotionLogEntry";

/** How many entries one page loads, in either direction. */
const PAGE_SIZE = 20;
/** Start loading the next page when this close (px) to either end. */
const LOAD_THRESHOLD = 400;
/** Entries kept above the day jumped to, so it is clear the list goes on upwards. */
const ENTRIES_ABOVE_TARGET = 3;
/** Distance from the bottom (px) past which the "jump to bottom" FAB shows up. */
const FAB_DISTANCE = 300;
/** Programmatic positioning stops re-applying itself after this long. */
const POSITIONING_TIMEOUT_MS = 1500;
const TODAY_KEY = "today";
const HEADER_KEY = "header";

// Native keeps the visible rows in place when older ones are prepended
// (maintainVisibleContentPosition) and reports row positions via onLayout.
// react-native-web has neither: onLayout only fires on size changes, so
// there rows are measured from the DOM and the scroll offset is corrected
// by hand from the position of an anchor row.
const IS_WEB = Platform.OS === "web";

type DomNode = { getBoundingClientRect: () => { top: number } };

type Range = {
  /** First date shown; null = the last PAGE_SIZE entries before `end`. */
  start: string | null;
  /** Last date shown; null = everything down to (and including) today. */
  end: string | null;
};

type Positioning = { kind: "bottom" } | { kind: "item"; key: string };

interface EmotionLogListProps {
  logs: EmotionLogLocal[];
  /** Day to open the list at; null opens it at the bottom (today). */
  target: string | null;
  onSave: (date: string, rate: number, note?: string) => Promise<void> | void;
}

// index of the first entry >= date
const lowerBound = (arr: string[], date: string) => {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] < date) lo = mid + 1;
    else hi = mid;
  }
  return lo;
};
// index of the first entry > date
const upperBound = (arr: string[], date: string) => {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] <= date) lo = mid + 1;
    else hi = mid;
  }
  return lo;
};

export default function EmotionLogList({ logs, target, onSave }: EmotionLogListProps) {
  const theme = useAppTheme();
  const today = getTodayDateString();
  const { scrollRef, keyboardHeight, handleScroll, registerFocusedInput } = useKeyboardScrollIntoView();

  // A day picked in the calendar is jumped to; future days (and today) mean
  // the bottom of the list, where today always sits.
  const jumpDate = target && target < today ? target : null;

  // Past days in chronological order. Today is rendered separately as the
  // last row. A day picked in the calendar that has no entry still gets a
  // row, so one can be added to it.
  const entries = useMemo(() => {
    const dates = new Set(logs.filter((l) => l.log_date < today).map((l) => l.log_date));
    if (jumpDate) dates.add(jumpDate);
    return [...dates].sort();
  }, [logs, today, jumpDate]);

  const logByDate = useMemo(() => new Map(logs.map((l) => [l.log_date, l])), [logs]);

  const [range, setRange] = useState<Range>(() => {
    if (!jumpDate) return { start: null, end: null };
    const idx = lowerBound(entries, jumpDate);
    const end = idx + PAGE_SIZE >= entries.length ? null : entries[idx + PAGE_SIZE - 1];
    return { start: entries[Math.max(0, idx - ENTRIES_ABOVE_TARGET)], end };
  });

  const endIdx = range.end === null ? entries.length : upperBound(entries, range.end);
  const startIdx = range.start === null ? Math.max(0, endIdx - PAGE_SIZE) : lowerBound(entries, range.start);
  const visible = entries.slice(startIdx, endIdx);
  const hasOlder = startIdx > 0;
  const atBottom = endIdx >= entries.length;

  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [showFab, setShowFab] = useState(false);

  // --- scroll bookkeeping -------------------------------------------------
  const itemY = useRef(new Map<string, number>());
  const scrollY = useRef(0);
  const contentH = useRef(0);
  const viewportH = useRef(0);
  const expectedY = useRef<number | null>(null);
  const positioning = useRef<Positioning | null>(
    jumpDate ? { kind: "item", key: jumpDate } : { kind: "bottom" }
  );
  const positioningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const itemRefs = useRef(new Map<string, View | null>());
  // Row that has to stay put while older rows are prepended above it
  // (`top` is its on-screen position, only used on web).
  const anchor = useRef<{ key: string; top: number | null } | null>(null);

  const domTop = (key: string): number | null => {
    const node = itemRefs.current.get(key) as unknown as DomNode | null | undefined;
    return node?.getBoundingClientRect ? node.getBoundingClientRect().top : null;
  };

  // Offset of a row inside the scroll content.
  const measureItemY = (key: string): number | null => {
    if (!IS_WEB) return itemY.current.get(key) ?? null;
    const top = domTop(key);
    const container = scrollRef.current?.getScrollableNode?.() as unknown as DomNode | null | undefined;
    if (top == null || !container?.getBoundingClientRect) return null;
    return scrollY.current + top - container.getBoundingClientRect().top;
  };

  const stopPositioning = useCallback(() => {
    positioning.current = null;
    expectedY.current = null;
    if (positioningTimer.current) clearTimeout(positioningTimer.current);
    positioningTimer.current = null;
  }, []);

  const startPositioning = useCallback(
    (p: Positioning) => {
      positioning.current = p;
      if (positioningTimer.current) clearTimeout(positioningTimer.current);
      positioningTimer.current = setTimeout(stopPositioning, POSITIONING_TIMEOUT_MS);
    },
    [stopPositioning]
  );

  useEffect(() => {
    startPositioning(positioning.current ?? { kind: "bottom" });
    return () => {
      if (positioningTimer.current) clearTimeout(positioningTimer.current);
    };
  }, [startPositioning]);

  const scrollTo = (y: number, animated = false) => {
    expectedY.current = y;
    scrollRef.current?.scrollTo({ y, animated });
  };

  // Puts the list where it was asked to be (bottom / a given day). Called
  // whenever the layout changes, until the user takes over or it times out,
  // since rows keep measuring themselves after the first render.
  const applyPositioning = () => {
    const p = positioning.current;
    if (!p) return false;
    if (p.kind === "bottom") {
      expectedY.current = Math.max(0, contentH.current - viewportH.current);
      scrollRef.current?.scrollToEnd({ animated: false });
      return true;
    }
    const y = measureItemY(p.key);
    if (y == null) return false;
    scrollTo(Math.max(0, y - Spacing.sm));
    return true;
  };

  const updateFab = (y: number) => {
    const distance = contentH.current - (y + viewportH.current);
    const next = !atBottom || distance > FAB_DISTANCE;
    setShowFab((prev) => (prev === next ? prev : next));
  };

  const loadOlder = () => {
    if (!hasOlder || anchor.current) return;
    const key = visible[0] ?? (atBottom ? TODAY_KEY : undefined);
    if (key) anchor.current = { key, top: IS_WEB ? domTop(key) : null };
    const newStart = entries[Math.max(0, startIdx - PAGE_SIZE)];
    setRange((r) => ({ ...r, start: newStart }));
  };

  const loadNewer = () => {
    if (atBottom) return;
    const newEndIdx = endIdx + PAGE_SIZE;
    const newEnd = newEndIdx >= entries.length ? null : entries[newEndIdx - 1];
    // Pin the start explicitly, otherwise the auto start would slide down
    // together with the end and rows would vanish above.
    const pinnedStart = entries[startIdx] ?? null;
    setRange({ start: pinnedStart, end: newEnd });
  };

  const checkLoad = (y: number) => {
    if (y < LOAD_THRESHOLD) loadOlder();
    if (y + viewportH.current > contentH.current - LOAD_THRESHOLD) loadNewer();
  };

  // Once older rows are in, keep the row that was on top where it was.
  const settleAnchor = () => {
    const a = anchor.current;
    if (!a) return;
    anchor.current = null;
    if (!IS_WEB || positioning.current || a.top == null) return;
    const top = domTop(a.key);
    if (top == null) return;
    const delta = top - a.top;
    if (Math.abs(delta) > 0.5) scrollTo(Math.max(0, scrollY.current + delta));
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    handleScroll(e);
    const y = e.nativeEvent.contentOffset.y;
    scrollY.current = y;
    contentH.current = e.nativeEvent.contentSize.height;
    viewportH.current = e.nativeEvent.layoutMeasurement.height;
    // Web has no drag events: a scroll that lands somewhere we did not
    // send it to is the user scrolling (wheel, touch, scrollbar).
    if (
      Platform.OS === "web" &&
      positioning.current &&
      expectedY.current != null &&
      Math.abs(y - expectedY.current) > 50
    ) {
      stopPositioning();
    }
    updateFab(y);
    checkLoad(y);
  };

  const onContentSizeChange = (_w: number, h: number) => {
    contentH.current = h;
    settleAnchor();
    applyPositioning();
    updateFab(scrollY.current);
    // Content shorter than the screen never scrolls, so the scroll
    // handler would never ask for more.
    checkLoad(scrollY.current);
  };

  const onViewportLayout = (e: LayoutChangeEvent) => {
    viewportH.current = e.nativeEvent.layout.height;
    applyPositioning();
  };

  const setItemRef = (key: string) => (r: View | null) => {
    itemRefs.current.set(key, r);
  };

  const onItemLayout = (key: string) => (e: LayoutChangeEvent) => {
    const y = e.nativeEvent.layout.y;
    itemY.current.set(key, y);
    if (positioning.current?.kind === "item" && positioning.current.key === key) applyPositioning();
  };

  const jumpToBottom = () => {
    anchor.current = null;
    if (atBottom) {
      stopPositioning();
      scrollRef.current?.scrollToEnd({ animated: true });
      return;
    }
    startPositioning({ kind: "bottom" });
    setRange({ start: null, end: null });
  };

  const handleNoteFocus = (ref: React.RefObject<View | null>) => {
    stopPositioning();
    registerFocusedInput(ref);
  };

  const handleSave = async (date: string, rate: number, note?: string) => {
    await onSave(date, rate, note);
    setEditingDate((d) => (d === date ? null : d));
  };

  const renderEntry = (date: string, isToday = false) => (
    <View
      key={isToday ? TODAY_KEY : date}
      ref={setItemRef(isToday ? TODAY_KEY : date)}
      onLayout={onItemLayout(isToday ? TODAY_KEY : date)}
    >
      <EmotionLogEntry
        date={date}
        log={logByDate.get(date)}
        isToday={isToday}
        highlighted={date === jumpDate}
        editing={editingDate === date}
        onStartEdit={() => {
          stopPositioning();
          setEditingDate(date);
        }}
        onCancelEdit={() => setEditingDate(null)}
        onSave={(rate, note) => handleSave(date, rate, note)}
        onNoteFocus={handleNoteFocus}
      />
    </View>
  );

  return (
    <View style={{ flex: 1 }} onLayout={onViewportLayout}>
      <ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        onScrollBeginDrag={stopPositioning}
        onContentSizeChange={onContentSizeChange}
        scrollEventThrottle={16}
        maintainVisibleContentPosition={!IS_WEB ? { minIndexForVisible: 0 } : undefined}
        contentContainerStyle={{
          gap: Spacing.sm,
          padding: Spacing.sm,
          paddingBottom: keyboardHeight + MODE_SWITCH_CLEARANCE,
        }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        {!hasOlder && (
          <View key={HEADER_KEY}>
            <Link asChild href="/user/get-help">
              <TouchableRipple>
                <Surface
                  elevation={1}
                  style={{
                    borderRadius: BorderRadius.lg,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: Spacing.md,
                    paddingVertical: Spacing.md,
                    paddingHorizontal: Spacing.lg,
                  }}
                >
                  <Icon source="lifebuoy" size={24} color={theme.colors.primary} />
                  <ThemedText style={{ flex: 1 }} type="defaultSemiBold">Segítség kell?</ThemedText>
                  <Icon source="chevron-right" size={20} color={theme.colors.outline} />
                </Surface>
              </TouchableRipple>
            </Link>
          </View>
        )}
        {visible.map((date) => renderEntry(date))}
        {atBottom && renderEntry(today, true)}
      </ScrollView>
      {showFab && (
        <FAB
          icon="arrow-down"
          size="small"
          accessibilityLabel="Ugrás a lista aljára"
          onPress={jumpToBottom}
          style={{ position: "absolute", bottom: Spacing.lg, right: Spacing.lg }}
        />
      )}
    </View>
  );
}
