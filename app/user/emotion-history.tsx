import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import EmotionPicker from "@/components/EmotionPicker";
import { useEmotionLog } from "@/hooks/useEmotionLog";
import { emotionByRate } from "@/constants/emotions";
import { Spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/borderRadius";
import { useAppTheme } from "@/assets/theme";
import { useFocusEffect, Redirect, Link } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Platform, ScrollView, View, Image } from "react-native";
import { emotionAvailable } from "@/constants/emotionTiming";
import { Calendar } from "react-native-calendars";
import { Divider, Icon, IconButton, Surface, TextInput, TouchableRipple } from "react-native-paper";
import { useKeyboardScrollIntoView } from "@/hooks/useKeyboardScrollIntoView";

type MarkedDates = Record<
  string,
  {
    customStyles: {
      container: { backgroundColor: string; borderWidth: number; borderColor: string; borderRadius: number };
      text: { color: string; marginTop?: number };
    };
  }
>;

// react-native-calendars centers the day number using a fixed marginTop (no vertical
// centering on the cell) — a border on the cell eats into that space from the top,
// so bordered days need their text nudged back up by the border width to stay aligned
// with unbordered days.
const DAY_TEXT_MARGIN_TOP = Platform.OS === "android" ? 4 : 6;
  export const getTodayDateString = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

export default function EmotionHistoryScreen() {

  const theme = useAppTheme();
  const { logs, updateLog, loadFromServer } = useEmotionLog();
  const { scrollRef, keyboardHeight, handleScroll, registerFocusedInput } = useKeyboardScrollIntoView();
  const noteContainerRef = useRef<View>(null);

  const [selectedDate, setSelectedDate] = useState<string | null>(getTodayDateString());

  const [editMode, setEditMode] = useState(false);
  const [editRate, setEditRate] = useState<number | null>(null);
  const [editNote, setEditNote] = useState("");

  useFocusEffect(
    useCallback(() => {
      loadFromServer();
      setSelectedDate(getTodayDateString());
      setEditMode(false);
    }, [loadFromServer])
  );
  if (!emotionAvailable) return <Redirect href="/user" />;

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

  if (selectedDate) {
    const hasLog = Boolean(markedDates[selectedDate]);
    const selectedBorderWidth = 2;
    markedDates[selectedDate] = {
      customStyles: {
        container: {
          backgroundColor: hasLog ? markedDates[selectedDate].customStyles.container.backgroundColor : "transparent",
          borderWidth: selectedBorderWidth,
          borderColor: theme.colors.primary,
          borderRadius: 20,
        },
        text: {
          color: hasLog ? "#000" : theme.colors.onSurface,
          marginTop: DAY_TEXT_MARGIN_TOP - selectedBorderWidth,
        },
      },
    };
  }

  const selectedLog = selectedDate ? logs.find((l) => l.log_date === selectedDate) : null;

  const handleDayPress = (day: { dateString: string }) => {
    setSelectedDate(day.dateString);
    setEditMode(false);
    const log = logs.find((l) => l.log_date === day.dateString);
    setEditRate(log?.rate ?? null);
    setEditNote(log?.note ?? "");
  };

  const handleStartEdit = () => {
    if (!selectedLog) return;
    setEditRate(selectedLog.rate);
    setEditNote(selectedLog.note ?? "");
    setEditMode(true);
  };

  const handleStartNew = () => {
    setEditRate(null);
    setEditNote("");
    setEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedDate || editRate === null) return;
    await updateLog(selectedDate, editRate, editNote.trim() || undefined);
    setEditMode(false);
  };

  const isFutureDate = selectedDate ? selectedDate > getTodayDateString() : false;

  return (
    <ThemedView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        ref={scrollRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ padding: Spacing.md, paddingBottom: Spacing.md + keyboardHeight }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
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
          onDayPress={handleDayPress}
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

        {selectedDate && (
          <Surface elevation={0} style={{ marginTop: Spacing.lg, borderRadius: BorderRadius.lg, padding: Spacing.md }}>
            {editMode ? (
              <View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.sm }}>
                  <ThemedText variant="titleSmall" type="bold">{new Date(selectedDate).toLocaleDateString("hu-HU")}</ThemedText>
                  <IconButton icon="check" onPress={handleSaveEdit} />
                </View>
                <EmotionPicker value={editRate} onSelect={setEditRate} />
                <View ref={noteContainerRef} style={{ marginTop: Spacing.sm }}>
                  <TextInput
                    label="Jegyzet"
                    value={editNote}
                    onChangeText={setEditNote}
                    onFocus={() => registerFocusedInput(noteContainerRef)}
                    multiline
                    numberOfLines={6}
                  />
                </View>
              </View>
            ) : selectedLog ? (
              <View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <ThemedText variant="labelLarge">{new Date(selectedDate).toLocaleDateString("hu-HU")}</ThemedText>
                  <IconButton icon="pencil" onPress={handleStartEdit} />
                </View>
                <Divider style={{ marginVertical: Spacing.sm }} />
                <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.md }}>
                  <Image
                    source={emotionByRate(selectedLog.rate)?.image}
                    style={{ width: 48, height: 48 }}
                  />
                </View>
                {selectedLog.note ? (
                  <ThemedText style={{ marginTop: Spacing.sm }}>{selectedLog.note}</ThemedText>
                ) : (
                  <ThemedText style={{ marginTop: Spacing.sm }}>Nincs jegyzet.</ThemedText>
                )}
              </View>
            ) : (
              <View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <ThemedText variant="labelLarge">{new Date(selectedDate).toLocaleDateString("hu-HU")}</ThemedText>
                  {!isFutureDate && <IconButton icon="plus" onPress={handleStartNew} />}
                </View>
                <Divider style={{ marginVertical: Spacing.sm }} />
                <ThemedText>Ezen a napon nincs bejegyzés.</ThemedText>
              </View>
            )}
          </Surface>
        )}

      </ScrollView>
    </ThemedView>
  );
}
