import { Spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/borderRadius";
import { useAppTheme } from "@/assets/theme";
import { useState } from "react";
import { View, Text, Platform } from "react-native";
import { Button, Card, IconButton, TouchableRipple } from "react-native-paper";
import { ThemedText } from "@/components/ThemedText";
import { useEmotionLog } from "@/hooks/useEmotionLog";

const SMILEYS: { emoji: string; label: string }[] = [
  { emoji: "😢", label: "Nagyon rossz" },
  { emoji: "😞", label: "Rossz" },
  { emoji: "😐", label: "Semleges" },
  { emoji: "🙂", label: "Jó" },
  { emoji: "😄", label: "Nagyszerű" },
];

type CardStatus = "idle" | "saving" | "saved" | "thanked" | "dismissed";

export default function EmotionCheckCard() {
  if (Platform.OS === "web") return null;

  return <EmotionCheckCardInner />;
}

function EmotionCheckCardInner() {
  const { shouldShowCard, isYesterday, saveLog } = useEmotionLog();
  const theme = useAppTheme();

  const [selectedRate, setSelectedRate] = useState<number | null>(null);
  const [status, setStatus] = useState<CardStatus>("idle");

  if (!shouldShowCard || status === "dismissed") return null;

  const title = isYesterday ? "Milyen napod volt tegnap?" : "Milyen napod volt?";

  const handleSave = async () => {
    if (selectedRate === null) return;
    setStatus("saving");
    await saveLog(selectedRate);
    setStatus("saved");
    setTimeout(() => {
      setStatus("thanked");
      setTimeout(() => setStatus("dismissed"), 2000);
    }, 3000);
  };

  if (status === "thanked") {
    return (
      <Card style={{ margin: Spacing.xs }}>
        <Card.Content>
          <ThemedText style={{ textAlign: "center", paddingVertical: Spacing.md }}>
            Köszi a válaszodat. Legyen szép napod! 😊
          </ThemedText>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={{ margin: Spacing.xs }}>
      <Card.Title
        title={title}
        right={() => (
          <IconButton icon="close" onPress={() => setStatus("dismissed")} />
        )}
      />
      <Card.Content>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-around",
            paddingBottom: Spacing.md,
          }}
        >
          {SMILEYS.map(({ emoji, label }, index) => {
            const rate = index + 1;
            const isSelected = selectedRate === rate;
            return (
              <TouchableRipple
                key={rate}
                onPress={() => setSelectedRate(rate)}
                borderless
                style={{
                  padding: Spacing.xs,
                  borderRadius: BorderRadius.sm,
                  borderWidth: 2,
                  borderColor: isSelected ? theme.colors.primary : "transparent",
                  alignItems: "center",
                }}
                accessibilityLabel={label}
              >
                <Text style={{ fontSize: isSelected ? 36 : 28 }}>{emoji}</Text>
              </TouchableRipple>
            );
          })}
        </View>
        <Button
          mode="contained"
          onPress={handleSave}
          disabled={selectedRate === null || status === "saving"}
          loading={status === "saving"}
        >
          {status === "saved" ? "Mentve!" : "Mentés"}
        </Button>
      </Card.Content>
    </Card>
  );
}
