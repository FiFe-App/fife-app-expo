import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import EmotionPicker from "@/components/EmotionPicker";
import { useEmotionLog } from "@/hooks/useEmotionLog";
import { emotionByRate } from "@/constants/emotions";
import { Spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/borderRadius";
import { useAppTheme } from "@/assets/theme";
import { useFocusEffect, Redirect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, View, Image } from "react-native";
import { emotionAvailable } from "@/constants/emotionTiming";
import { Calendar } from "react-native-calendars";
import { Divider, IconButton, Surface, TextInput } from "react-native-paper";

type MarkedDates = Record<string, { selected: boolean; selectedColor: string; selectedTextColor: string }>;

export default function EmotionHistoryScreen() {

  const theme = useAppTheme();
  const { logs, updateLog, loadFromServer } = useEmotionLog();

  const getTodayDateString = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState<string | null>(getTodayDateString());
  console.log(selectedDate);
  
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
      selected: true,
      selectedColor: emotion?.color ?? "#9e9e9e",
      selectedTextColor: "#fff",
    };
    return acc;
  }, {});

  if (selectedDate) {
    markedDates[selectedDate] = {
      ...(markedDates[selectedDate] ?? {}),
      selected: true,
      selectedColor: markedDates[selectedDate]?.selectedColor ?? theme.colors.primary,
      selectedTextColor: "#fff",
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

  const handleSaveEdit = async () => {
    if (!selectedDate || editRate === null) return;
    await updateLog(selectedDate, editRate, editNote.trim() || undefined);
    setEditMode(false);
  };

  return (
    <ThemedView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: Spacing.md }}>

        <Calendar
          markedDates={markedDates}
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
            {selectedLog ? (
              editMode ? (
                <View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.sm }}>
                    <ThemedText variant="titleSmall" type="bold">{new Date(selectedDate).toLocaleDateString("hu-HU")}</ThemedText>
                    <IconButton icon="check" onPress={handleSaveEdit} />
                  </View>
                  <EmotionPicker value={editRate} onSelect={setEditRate} />
                  <TextInput
                    label="Jegyzet"
                    value={editNote}
                    onChangeText={setEditNote}
                    multiline
                    numberOfLines={3}
                    style={{ marginTop: Spacing.sm }}
                  />
                </View>
              ) : (
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
              )
            ) : (

                <View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <ThemedText variant="labelLarge">{new Date(selectedDate).toLocaleDateString("hu-HU")}</ThemedText>
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
