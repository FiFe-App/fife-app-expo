import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { useEmotionLog } from "@/hooks/useEmotionLog";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { ScrollView, View, Platform } from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { Spacing } from "@/constants/spacing";
import { useAppTheme } from "@/assets/theme";
import { Redirect } from "expo-router";

const RATE_COLORS: Record<number, string> = {
  1: "#e53935",
  2: "#fb8c00",
  3: "#fdd835",
  4: "#7cb342",
  5: "#2e7d32",
};

const RATE_LABELS: Record<number, string> = {
  1: "😢 Nagyon rossz",
  2: "😞 Rossz",
  3: "😐 Semleges",
  4: "🙂 Jó",
  5: "😄 Nagyszerű",
};

type MarkedDates = Record<string, { selected: boolean; selectedColor: string; selectedTextColor: string }>;

export default function EmotionHistoryScreen() {
  if (Platform.OS === "web") return <Redirect href="/user" />;

  const theme = useAppTheme();
  const { allLogs, fetchAllLogs } = useEmotionLog();

  useFocusEffect(
    useCallback(() => {
      fetchAllLogs();
    }, [fetchAllLogs])
  );

  const markedDates: MarkedDates = allLogs.reduce<MarkedDates>((acc, log) => {
    const color = RATE_COLORS[log.rate] ?? "#9e9e9e";
    acc[log.log_date] = {
      selected: true,
      selectedColor: color,
      selectedTextColor: "#fff",
    };
    return acc;
  }, {});

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: Spacing.md }}>
        <ThemedText variant="titleMedium" type="bold" style={{ marginBottom: Spacing.md }}>
          Hangulat-napló
        </ThemedText>
        <Calendar
          markedDates={markedDates}
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
        <View style={{ marginTop: Spacing.lg, gap: Spacing.xs }}>
          <ThemedText type="label">Jelmagyarázat</ThemedText>
          {Object.entries(RATE_LABELS).map(([rate, label]) => (
            <View key={rate} style={{ flexDirection: "row", alignItems: "center", gap: Spacing.sm }}>
              <View
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: RATE_COLORS[Number(rate)],
                }}
              />
              <ThemedText>{label}</ThemedText>
            </View>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}
