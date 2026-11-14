import { useAppTheme } from "@/assets/theme";
import EmotionPicker from "@/components/EmotionPicker";
import { ThemedText } from "@/components/ThemedText";
import { BorderRadius } from "@/constants/borderRadius";
import { emotionByRate } from "@/constants/emotions";
import { Spacing } from "@/constants/spacing";
import { EmotionLogLocal } from "@/redux/store.type";
import { useRef, useState } from "react";
import { Image, View } from "react-native";
import { Button, IconButton, Surface, TextInput } from "react-native-paper";
import { formatLogDate } from "./dates";

interface EmotionLogEntryProps {
  date: string;
  log?: EmotionLogLocal;
  isToday?: boolean;
  highlighted?: boolean;
  editing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: (rate: number, note?: string) => Promise<void> | void;
  onNoteFocus?: (containerRef: React.RefObject<View | null>) => void;
}

export default function EmotionLogEntry({
  date,
  log,
  isToday,
  highlighted,
  editing,
  onStartEdit,
  onCancelEdit,
  onSave,
  onNoteFocus,
}: EmotionLogEntryProps) {
  const theme = useAppTheme();
  // Today without an entry asks right away — every other day only on request.
  const showForm = editing || (isToday && !log);

  return (
    <Surface
      elevation={0}
      style={{
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        borderWidth: 2,
        borderColor: highlighted ? theme.colors.primary : "transparent",
      }}
    >
      {showForm ? (
        <EntryForm
          key={`${date}-${log?.updated_at ?? "new"}`}
          date={date}
          log={log}
          isToday={isToday}
          canCancel={editing}
          onCancel={onCancelEdit}
          onSave={onSave}
          onNoteFocus={onNoteFocus}
        />
      ) : (
        <View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.md }}>
            {log ? (
              <Image source={emotionByRate(log.rate)?.image} style={{ width: 40, height: 40 }} />
            ) : (
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  borderWidth: 2,
                  borderStyle: "dashed",
                  borderColor: theme.colors.outline,
                }}
              />
            )}
            <View style={{ flex: 1 }}>
              {isToday && <ThemedText variant="labelSmall" style={{ color: theme.colors.primary }}>Ma</ThemedText>}
              <ThemedText variant="labelLarge" type="bold">{formatLogDate(date)}</ThemedText>
            </View>
            <IconButton
              icon={log ? "pencil" : "plus"}
              onPress={onStartEdit}
              accessibilityLabel={log ? "Bejegyzés szerkesztése" : "Bejegyzés hozzáadása"}
            />
          </View>
          {log ? (
            log.note ? (
              <ThemedText style={{ marginTop: Spacing.sm }}>{log.note}</ThemedText>
            ) : (
              <ThemedText style={{ marginTop: Spacing.sm, color: theme.colors.outline }}>Nincs jegyzet.</ThemedText>
            )
          ) : (
            <ThemedText style={{ marginTop: Spacing.sm, color: theme.colors.outline }}>
              Ezen a napon nincs bejegyzés.
            </ThemedText>
          )}
        </View>
      )}
    </Surface>
  );
}

function EntryForm({
  date,
  log,
  isToday,
  canCancel,
  onCancel,
  onSave,
  onNoteFocus,
}: {
  date: string;
  log?: EmotionLogLocal;
  isToday?: boolean;
  canCancel: boolean;
  onCancel: () => void;
  onSave: (rate: number, note?: string) => Promise<void> | void;
  onNoteFocus?: (containerRef: React.RefObject<View | null>) => void;
}) {
  const theme = useAppTheme();
  const [rate, setRate] = useState<number | null>(log?.rate ?? null);
  const [note, setNote] = useState(log?.note ?? "");
  const [saving, setSaving] = useState(false);
  const noteContainerRef = useRef<View>(null);

  const handleSave = async () => {
    if (rate === null) return;
    setSaving(true);
    try {
      await onSave(rate, note.trim() || undefined);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ flex: 1 }}>
          {isToday && <ThemedText variant="labelSmall" style={{ color: theme.colors.primary }}>Ma</ThemedText>}
          <ThemedText variant="titleSmall" type="bold">
            {isToday && !log ? "Hogy vagy ma?" : formatLogDate(date)}
          </ThemedText>
        </View>
        {canCancel && <IconButton icon="close" onPress={onCancel} accessibilityLabel="Mégse" />}
      </View>
      <EmotionPicker value={rate} onSelect={setRate} />
      <View ref={noteContainerRef} style={{ marginTop: Spacing.sm }}>
        <TextInput
          label={isToday ? "Mesélj a napodról :)" : "Jegyzet"}
          placeholder={isToday ? "Írd le milyen napod volt, ha gondolod!" : undefined}
          value={note}
          onChangeText={setNote}
          onFocus={() => onNoteFocus?.(noteContainerRef)}
          multiline
          numberOfLines={4}
        />
      </View>
      <Button
        mode="contained"
        onPress={handleSave}
        disabled={rate === null || saving}
        loading={saving}
        style={{ marginTop: Spacing.md }}
      >
        Mentés
      </Button>
    </View>
  );
}
