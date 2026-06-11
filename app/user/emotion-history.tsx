import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import EmotionPicker from "@/components/EmotionPicker";
import { useEmotionLog } from "@/hooks/useEmotionLog";
import { emotionByRate, EMOTIONS } from "@/constants/emotions";
import { Spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/borderRadius";
import { useAppTheme } from "@/assets/theme";
import { useFocusEffect, Redirect } from "expo-router";
import { useCallback, useState } from "react";
import { Platform, ScrollView, View } from "react-native";
import { Calendar } from "react-native-calendars";
import { Card, Divider, Icon, IconButton, Surface, TextInput } from "react-native-paper";

type MarkedDates = Record<string, { selected: boolean; selectedColor: string; selectedTextColor: string }>;

export default function EmotionHistoryScreen() {
  if (Platform.OS === "web") return <Redirect href="/user" />;

  const theme = useAppTheme();
  const { logs, updateLog, loadFromServer } = useEmotionLog();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editRate, setEditRate] = useState<number | null>(null);
  const [editNote, setEditNote] = useState("");

  useFocusEffect(
    useCallback(() => {
      loadFromServer();
      setSelectedDate(null);
      setEditMode(false);
    }, [loadFromServer])
  );

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
    <ThemedView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: Spacing.md }}>
        <ThemedText variant="titleMedium" type="bold" style={{ marginBottom: Spacing.md }}>
          Hangulat-napló
        </ThemedText>

        <Calendar
          markedDates={markedDates}
          onDayPress={handleDayPress}
          theme={{
            backgroundColor: theme.colors.surface,
            calendarBackground: theme.colors.surface,
            textSectionTitleColor: theme.colors.onSurface,
            dayTextColor: theme.colors.onSurface,
            todayTextColor: theme.colors.primary,
            monthTextColor: theme.colors.onSurface,
            arrowColor: theme.colors.primary,
          }}
          firstDay={1}
        />

        {selectedDate && (
          <Surface elevation={1} style={{ marginTop: Spacing.lg, borderRadius: BorderRadius.lg, padding: Spacing.md }}>
            {selectedLog ? (
              editMode ? (
                <View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.sm }}>
                    <ThemedText variant="titleSmall" type="bold">{selectedDate}</ThemedText>
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
                    <ThemedText variant="labelLarge">{selectedDate}</ThemedText>
                    <IconButton icon="pencil" onPress={handleStartEdit} />
                  </View>
                  <Divider style={{ marginVertical: Spacing.sm }} />
                  <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.md }}>
                    <Icon
                      source={emotionByRate(selectedLog.rate)?.icon ?? "emoticon-neutral-outline"}
                      size={48}
                      color={emotionByRate(selectedLog.rate)?.color}
                    />
                    <ThemedText variant="bodyLarge" type="bold" style={{ color: emotionByRate(selectedLog.rate)?.color }}>
                      {emotionByRate(selectedLog.rate)?.label}
                    </ThemedText>
                  </View>
                  {selectedLog.note ? (
                    <ThemedText style={{ marginTop: Spacing.sm }}>{selectedLog.note}</ThemedText>
                  ) : (
                    <ThemedText type="label" style={{ marginTop: Spacing.sm }}>Nincs jegyzet</ThemedText>
                  )}
                </View>
              )
            ) : (
              <ThemedText type="label">Ezen a napon nincs bejegyzés.</ThemedText>
            )}
          </Surface>
        )}

        <View style={{ marginTop: Spacing.xl, gap: Spacing.xs }}>
          <ThemedText type="label" style={{ marginBottom: Spacing.xs }}>Jelmagyarázat</ThemedText>
          {EMOTIONS.map((e) => (
            <View key={e.rate} style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm }}>
              <Icon source={e.icon} size={20} color={e.color} />
              <ThemedText>{e.label}</ThemedText>
            </View>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}
