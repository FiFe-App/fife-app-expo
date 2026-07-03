import { Spacing } from "@/constants/spacing";
import { useState } from "react";
import { View } from "react-native";
import { Button, Card, IconButton, TextInput, TouchableRipple } from "react-native-paper";
import { ThemedText } from "@/components/ThemedText";
import { useEmotionLog } from "@/hooks/useEmotionLog";
import EmotionPicker from "@/components/EmotionPicker";
import { Link } from "expo-router";

type CardStatus = "idle" | "saving" | "saved" | "thanked" | "dismissed";

export default function EmotionCheckCard() {
  return <EmotionCheckCardInner />;
}

function EmotionCheckCardInner() {
  const { shouldShowCard, saveLog } = useEmotionLog();
  const [selectedRate, setSelectedRate] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<CardStatus>("idle");

  const showForm = shouldShowCard && status !== "dismissed" && status !== "thanked";

  const handleSave = async () => {
    if (selectedRate === null) return;
    setStatus("saving");
    await saveLog(selectedRate, note.trim() || undefined);
    setStatus("thanked");
    setTimeout(() => setStatus("dismissed"), 4000);
  };

  return (
    <Card style={{ margin: Spacing.lg }} elevation={1}>
      <Link asChild href="/user/emotion-history">
        <TouchableRipple>
          <View style={{ flex:1,flexDirection:"row",alignItems:"center", paddingHorizontal:Spacing.md }}>
            <ThemedText style={{flex:1}} type="subtitle">{showForm ? "Hogy vagy ma?" : "Naplód"}</ThemedText>
            <IconButton
              icon="calendar-month"
            />
          </View>
        </TouchableRipple>
      </Link>
      {status === "thanked" ? (
        <Card.Content 
        pointerEvents="none">
          <ThemedText type="bold" style={{ textAlign: "center", paddingVertical: Spacing.xs }}>
            Köszi a válaszodat. {"\n"} Legyen szép napod! :)
          </ThemedText>
        </Card.Content>
      ) : showForm ? (
        <Card.Content>
          <EmotionPicker
            value={selectedRate}
            onSelect={setSelectedRate}
            disabled={status === "saving" || status == "saved"}
          />
          {selectedRate !== null && (
            <View style={{ marginTop: Spacing.sm }}>
              <TextInput
                label="Fejlegyzéseid"
                placeholder="Írd le milyen napod volt, ha gondolod!"
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={10}
                disabled={selectedRate === null || status === "saving" || status == "saved"}
              />
            </View>
          )}
          <Button
            mode="contained"
            onPress={handleSave}
            disabled={selectedRate === null || status === "saving" || status == "saved"}
            loading={status === "saving"}
            style={{ marginTop: Spacing.md }}
          >
            {status === "saved" ? "Mentve!" : "Mentés"}
          </Button>
        </Card.Content>
      ) : null}
    </Card>
  );
}
