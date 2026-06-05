import { Spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/borderRadius";
import { useAppTheme } from "@/assets/theme";
import { useState } from "react";
import { View, Text, Image, Platform } from "react-native";
import { Button, Card, IconButton, TouchableRipple } from "react-native-paper";
import { ThemedText } from "@/components/ThemedText";
import { useEmotionLog } from "@/hooks/useEmotionLog";
import { Emotion, SMILEYS } from "@/constants/emotionTiming";

function SmileyIcon({ Emotion, size }: { Emotion: Emotion; size: number }) {
  if (Emotion.image) {
    return <Image source={Emotion.image} style={{ width: size, height: size }} />;
  }
  return <Text style={{ fontSize: size }}>{Emotion.emoji}</Text>;
}

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
  const [saveError, setSaveError] = useState<string | null>(null);

  if (!shouldShowCard || status === "dismissed") return null;

  const title = isYesterday ? "Milyen napod volt tegnap?" : "Milyen napod volt?";

  const handleSave = async () => {
    if (selectedRate === null) return;
    setStatus("saving");
    setSaveError(null);
    const { error } = await saveLog(selectedRate);
    if (error) {
      setSaveError(error);
      setStatus("idle");
      return;
    }
    setStatus("thanked");
      setTimeout(() => setStatus("dismissed"), 6000);
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
    <Card mode="contained" style={{ margin: Spacing.md }}>
      <View style={{flexDirection:"row",alignItems:"center"}}>
        <ThemedText variant="bodyLarge" style={{ margin: Spacing.sm, flex:1 }}>
          {title}
        </ThemedText>
        <IconButton icon="close" onPress={() => setStatus("dismissed")} />
      
    </View>
      <Card.Content>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-around",
            paddingBottom: Spacing.md,
          }}
        >
          {SMILEYS.map(({ label }, index) => {
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
                  borderWidth: 1,
                  borderColor: isSelected ? theme.colors.primary : "transparent",
                  alignItems: "center",
                }}
                accessibilityLabel={label}
              >
                <SmileyIcon Emotion={SMILEYS[index]} size={28} />
              </TouchableRipple>
            );
          })}
        </View>
        {saveError && (
          <ThemedText
            style={{ color: theme.colors.error, marginBottom: Spacing.xs, textAlign: "center" }}
          >
            {saveError}
          </ThemedText>
        )}
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
