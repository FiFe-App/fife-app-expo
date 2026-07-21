import { Spacing } from "@/constants/spacing";
import { useState } from "react";
import { Image, View } from "react-native";
import { Button, Card, IconButton, TextInput, TouchableRipple } from "react-native-paper";
import { ThemedText } from "@/components/ThemedText";
import { useEmotionLog } from "@/hooks/useEmotionLog";
import { emotionByRate } from "@/constants/emotions";
import EmotionPicker from "@/components/EmotionPicker";
import { Link } from "expo-router";

export default function EmotionCheckCard() {
  return <EmotionCheckCardInner />;
}

function EmotionCheckCardInner() {
  const { shouldShowCard, saveLog, logs, targetDate } = useEmotionLog();
  const todayLog = logs.find((l) => l.log_date === targetDate);
  const [selectedRate, setSelectedRate] = useState<number | null>(null);
  const [note, setNote] = useState("");

  const showForm = shouldShowCard && !todayLog;

  const handleSave = async () => {
    if (selectedRate === null) return;
    await saveLog(selectedRate, note.trim() || undefined);
  };

  return (
    <Card style={{ margin: Spacing.lg }} elevation={1}>
      <Link asChild href="/user/emotion-history">
        <TouchableRipple>
          <View style={{ flex:1,flexDirection:"row",alignItems:"center", paddingHorizontal:Spacing.md }}>
            <ThemedText style={{flex:1}} type="subtitle">{showForm ? "Hogy vagy ma?" : ("Napló - "+ new Date().toLocaleDateString("hu-HU"))}</ThemedText>
            <IconButton
              icon="calendar-month"
            />
          </View>
        </TouchableRipple>
      </Link>
      {todayLog ? (
        <Card.Content>
          <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.md }}>
            <Image source={emotionByRate(todayLog.rate)?.image} style={{ width: 48, height: 48 }} />
          </View>
          {todayLog.note ? (
            <ThemedText style={{ marginTop: Spacing.sm }}>{todayLog.note}</ThemedText>
          ) : null}
        </Card.Content>
      ) : showForm ? (
        <Card.Content>
          <EmotionPicker
            value={selectedRate}
            onSelect={setSelectedRate}
          />
          {selectedRate !== null && (
            <View style={{ marginTop: Spacing.sm }}>
              <TextInput
                label="Mesélj a napodról :)"
                placeholder="Írd le milyen napod volt, ha gondolod!"
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={10}
              />
            </View>
          )}
          <Button
            mode="contained"
            onPress={handleSave}
            disabled={selectedRate === null}
            style={{ marginTop: Spacing.md }}
          >
            Mentés
          </Button>
        </Card.Content>
      ) : null}
    </Card>
  );
}
