import { Spacing } from "@/constants/spacing";
import { useRef, useState } from "react";
import { Image, View } from "react-native";
import { Button, Card, IconButton, TextInput, TouchableRipple } from "react-native-paper";
import { ThemedText } from "@/components/ThemedText";
import { useEmotionLog } from "@/hooks/useEmotionLog";
import { emotionByRate } from "@/constants/emotions";
import EmotionPicker from "@/components/EmotionPicker";
import { Link } from "expo-router";

interface EmotionCheckCardProps {
  // Called with the note input's container ref when it's focused, so a
  // parent ScrollView can scroll it above the keyboard. See ToDoList's
  // onRequestScrollIntoView for the same need on "Új feladat" — this input
  // isn't at the bottom of scroll content, so it needs its own position.
  onNoteFocus?: (containerRef: React.RefObject<View | null>) => void;
}

export default function EmotionCheckCard({ onNoteFocus }: EmotionCheckCardProps) {
  return <EmotionCheckCardInner onNoteFocus={onNoteFocus} />;
}

function EmotionCheckCardInner({ onNoteFocus }: EmotionCheckCardProps) {
  const { shouldShowCard, saveLog, logs, targetDate } = useEmotionLog();
  const todayLog = logs.find((l) => l.log_date === targetDate);
  const [selectedRate, setSelectedRate] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const noteContainerRef = useRef<View>(null);

  const showForm = shouldShowCard && !todayLog;

  const handleSave = async () => {
    if (selectedRate === null) return;
    await saveLog(selectedRate, note.trim() || undefined);
  };

  return (
    <Card style={{ marginVertical: Spacing.sm }} elevation={1}>
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
            <View ref={noteContainerRef} style={{ marginTop: Spacing.sm }}>
              <TextInput
                label="Mesélj a napodról :)"
                placeholder="Írd le milyen napod volt, ha gondolod!"
                value={note}
                onChangeText={setNote}
                onFocus={() => onNoteFocus?.(noteContainerRef)}
                multiline
                numberOfLines={6}
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
