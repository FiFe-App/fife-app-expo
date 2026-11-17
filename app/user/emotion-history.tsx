import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import EmotionLogList from "@/components/emotion-log/EmotionLogList";
import { getTodayDateString } from "@/components/emotion-log/dates";
import { useEmotionLog } from "@/hooks/useEmotionLog";
import { emotionByRate } from "@/constants/emotions";
import { Spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/borderRadius";
import { useAppTheme } from "@/assets/theme";
import { trackEvent } from "@/lib/analytics";
import { clearOptions, setOptions } from "@/redux/reducers/infoReducer";
import { useFocusEffect, Redirect, Link } from "expo-router";
import { useCallback, useState } from "react";
import { Platform, ScrollView } from "react-native";
import { useDispatch } from "react-redux";
import { emotionAvailable } from "@/constants/emotionTiming";
import { Calendar } from "react-native-calendars";
import { Icon, Surface, TouchableRipple } from "react-native-paper";
import { MODE_SWITCH_CLEARANCE } from "@/constants/layout";

type MarkedDates = Record<
  string,
  {
    customStyles: {
      container: { backgroundColor: string; borderWidth: number; borderColor: string; borderRadius: number };
      text: { color: string; marginTop?: number };
    };
  }
>;

type ViewMode = "list" | "calendar";

// react-native-calendars centers the day number using a fixed marginTop (no vertical
// centering on the cell) — a border on the cell eats into that space from the top,
// so bordered days need their text nudged back up by the border width to stay aligned
// with unbordered days.
const DAY_TEXT_MARGIN_TOP = Platform.OS === "android" ? 4 : 6;

export default function EmotionHistoryScreen() {
  const dispatch = useDispatch();
  const { logs, updateLog, loadFromServer } = useEmotionLog();

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  // Every jump remounts the list (keyed by `id`), so it always opens on a
  // fresh page around the requested day — `date: null` means the bottom.
  const [jump, setJump] = useState<{ id: number; date: string | null }>({ id: 0, date: null });

  const openList = useCallback((date: string | null) => {
    setJump((j) => ({ id: j.id + 1, date }));
    setViewMode("list");
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFromServer();
      setJump((j) => ({ id: j.id + 1, date: null }));
    }, [loadFromServer])
  );

  // The header button shows the view it switches *to*.
  useFocusEffect(
    useCallback(() => {
      dispatch(
        setOptions([
          viewMode === "list"
            ? { icon: "calendar-month", title: "Naptár nézet", onPress: () => setViewMode("calendar") }
            : { icon: "format-list-bulleted", title: "Lista nézet", onPress: () => openList(null) },
        ])
      );
      return () => {
        dispatch(clearOptions());
      };
    }, [dispatch, viewMode, openList])
  );

  const handleSave = useCallback(
    async (date: string, rate: number, note?: string) => {
      const isNew = !logs.some((l) => l.log_date === date);
      await updateLog(date, rate, note);
      // Only that an entry was saved — never the rate or the note.
      if (isNew) trackEvent("emotion_logged", { hasNote: !!note });
    },
    [logs, updateLog]
  );

  if (!emotionAvailable) return <Redirect href="/user" />;

  return (
    <ThemedView style={{ flex: 1 }}>
      {viewMode === "list" ? (
        <EmotionLogList key={jump.id} logs={logs} target={jump.date} onSave={handleSave} />
      ) : (
        <CalendarView logs={logs} onDayPress={(date) => openList(date)} />
      )}
    </ThemedView>
  );
}

function CalendarView({
  logs,
  onDayPress,
}: {
  logs: ReturnType<typeof useEmotionLog>["logs"];
  onDayPress: (date: string) => void;
}) {
  const theme = useAppTheme();
  const today = getTodayDateString();

  const markedDates: MarkedDates = logs.reduce<MarkedDates>((acc, log) => {
    const emotion = emotionByRate(log.rate);
    acc[log.log_date] = {
      customStyles: {
        container: {
          backgroundColor: emotion?.color ?? "#9e9e9e",
          borderWidth: 0,
          borderColor: "transparent",
          borderRadius: 20,
        },
        text: { color: "#000" },
      },
    };
    return acc;
  }, {});

  // Today gets a ring, filled in if it already has an entry.
  const selectedBorderWidth = 2;
  const todayHasLog = Boolean(markedDates[today]);
  markedDates[today] = {
    customStyles: {
      container: {
        backgroundColor: todayHasLog ? markedDates[today].customStyles.container.backgroundColor : "transparent",
        borderWidth: selectedBorderWidth,
        borderColor: theme.colors.primary,
        borderRadius: 20,
      },
      text: {
        color: todayHasLog ? "#000" : theme.colors.onSurface,
        marginTop: DAY_TEXT_MARGIN_TOP - selectedBorderWidth,
      },
    },
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: Spacing.md, paddingBottom: Spacing.md + MODE_SWITCH_CLEARANCE }}
    >
      <Link asChild href="/user/get-help">
        <TouchableRipple>
          <Surface
            elevation={1}
            style={{
              borderRadius: BorderRadius.lg,
              marginBottom: Spacing.lg,
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
      <Calendar
        markedDates={markedDates}
        markingType="custom"
        onDayPress={(day: { dateString: string }) => onDayPress(day.dateString)}
        theme={{
          backgroundColor: theme.colors.background,
          calendarBackground: theme.colors.background,
          textSectionTitleColor: theme.colors.onSurface,
          dayTextColor: theme.colors.onSurface,
          todayTextColor: theme.colors.primary,
          monthTextColor: theme.colors.onSurface,
          arrowColor: theme.colors.primary,
        }}
        firstDay={1}
      />
      <ThemedText style={{ marginTop: Spacing.md, textAlign: "center", color: theme.colors.outline }}>
        Koppints egy napra a bejegyzéséhez.
      </ThemedText>
    </ScrollView>
  );
}
