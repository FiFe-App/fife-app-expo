import { Spacing } from "@/constants/spacing";
import { useState } from "react";
import { View } from "react-native";
import { Button, Card, IconButton, TextInput } from "react-native-paper";
import { ThemedText } from "@/components/ThemedText";
import { useEmotionLog } from "@/hooks/useEmotionLog";
import EmotionPicker from "@/components/EmotionPicker";
import { emotionAvailable } from "@/constants/emotionTiming";

type CardStatus = "idle" | "saving" | "saved" | "thanked" | "dismissed";

export default function EmotionCheckCard() {
  if (!emotionAvailable) return null;
  return <EmotionCheckCardInner />;
}

function EmotionCheckCardInner() {
  const { shouldShowCard, isYesterday, saveLog } = useEmotionLog();
  const [selectedRate, setSelectedRate] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<CardStatus>("idle");

  if (!shouldShowCard || status === "dismissed") return null;

  if (status === "thanked") {
    return (
      <Card style={{ margin: Spacing.xs }}>
        <Card.Content>
          <ThemedText style={{ textAlign: "center", paddingVertical: Spacing.md }}>
            Köszi a válaszodat. Legyen szép napod!
          </ThemedText>
        </Card.Content>
      </Card>
    );
  }

  const handleSave = async () => {
    if (selectedRate === null) return;
    setStatus("saving");
    await saveLog(selectedRate, note.trim() || undefined);
    setStatus("saved");
    setTimeout(() => {
      setStatus("thanked");
      setTimeout(() => setStatus("dismissed"), 2000);
    }, 3000);
  };

  return (
    <Card style={{ margin: Spacing.xs }}>
      <Card.Title
        title={isYesterday ? "Milyen napod volt tegnap?" : "Milyen napod volt?"}
        right={() => (
          <IconButton icon="close" onPress={() => setStatus("dismissed")} />
        )}
      />
      <Card.Content>
        <EmotionPicker
          value={selectedRate}
          onSelect={setSelectedRate}
          disabled={status === "saving"}
        />
        {selectedRate !== null && (
          <View style={{ marginTop: Spacing.sm }}>
            <TextInput
              label="Jegyzet (opcionális)"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={2}
              disabled={status === "saving"}
            />
          </View>
        )}
        <Button
          mode="contained"
          onPress={handleSave}
          disabled={selectedRate === null || status === "saving"}
          loading={status === "saving"}
          style={{ marginTop: Spacing.md }}
        >
          {status === "saved" ? "Mentve!" : "Mentés"}
        </Button>
      </Card.Content>
    </Card>
  );
}
