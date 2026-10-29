import { useEffect, useState } from "react";
import { Linking, ScrollView, View, useWindowDimensions } from "react-native";
import {
  Chip,
  Icon,
  IconButton,
  Text,
  TextInput,
  TouchableRipple,
} from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import {
  addSubtask,
  deleteSubtask,
  deleteTask,
  setTaskReminder,
  snoozeTask,
  toggleSubtask,
  updateTaskTitle,
} from "@/redux/reducers/userReducer";
import {
  KeyboardAwareModal,
  useKeyboardHeight,
} from "@/components/KeyboardAwareModal";
import { ModalCard, modalContainerStyle } from "@/components/ModalCard";
import { Button } from "@/components/Button";
import { useAppTheme } from "@/assets/theme";
import { BorderRadius } from "@/constants/borderRadius";
import { Spacing } from "@/constants/spacing";
import {
  REMINDER_PRESETS,
  ReminderPreset,
  cancelTaskReminder,
  reminderTimeFor,
  scheduleTaskReminder,
} from "@/lib/notifications/scheduleTaskReminder";

interface TaskModalProps {
  /** The task to show; the modal is hidden while this is null. */
  taskId: string | null;
  onDismiss: () => void;
}

const newId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const googleSearchUrl = (title: string) =>
  `https://www.google.com/search?q=${encodeURIComponent(title)}`;

const formatRemindAt = (iso: string) =>
  new Date(iso).toLocaleString("hu-HU", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function TaskModal({ taskId, onDismiss }: TaskModalProps) {
  const theme = useAppTheme();
  const dispatch = useDispatch();
  const { height: windowHeight } = useWindowDimensions();
  const keyboardHeight = useKeyboardHeight();
  // Read from the store by id, so edits made in here show up straight away.
  const task = useSelector((state: RootState) =>
    taskId ? (state.user.tasks ?? []).find((t) => t.id === taskId) : undefined,
  );

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [newSubtask, setNewSubtask] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [reminderNote, setReminderNote] = useState<string | null>(null);

  useEffect(() => {
    setEditingTitle(false);
    setTitleDraft(task?.title ?? "");
    setNewSubtask("");
    setConfirmDelete(false);
    setReminderNote(null);
    // Reset when a different task is opened, not on every edit of the open one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  if (!task) return null;

  const subtasks = task.subtasks ?? [];
  const snoozeCount = task.snoozeCount ?? 0;

  // Edits go through only on request, like the mantra: pencil, type, check.
  const saveTitle = () => {
    const title = titleDraft.trim();
    setEditingTitle(false);
    if (!title || title === task.title) {
      setTitleDraft(task.title);
      return;
    }
    dispatch(updateTaskTitle({ id: task.id, title }));
    // The notification carries the title it was scheduled with.
    if (task.remindAt && new Date(task.remindAt).getTime() > Date.now()) {
      scheduleTaskReminder(task.id, title, new Date(task.remindAt));
    }
  };

  const startEditTitle = () => {
    setTitleDraft(task.title);
    setEditingTitle(true);
  };

  const handleAddSubtask = () => {
    const title = newSubtask.trim();
    if (!title) return;
    dispatch(
      addSubtask({ taskId: task.id, subtask: { id: newId(), title, checked: false } }),
    );
    setNewSubtask("");
  };

  const handleToggleSubtask = (subtaskId: string) => {
    dispatch(toggleSubtask({ taskId: task.id, subtaskId }));
    // The last open step finishing finishes the task, and a finished task has
    // nothing left to be reminded of.
    const othersDone = subtasks.every((s) => s.id === subtaskId || s.checked);
    const wasChecked = subtasks.find((s) => s.id === subtaskId)?.checked;
    if (othersDone && !wasChecked && task.remindAt) {
      dispatch(setTaskReminder({ id: task.id, remindAt: null }));
      cancelTaskReminder(task.id);
    }
  };

  const reportStatus = (status: Awaited<ReturnType<typeof scheduleTaskReminder>>) => {
    setReminderNote(
      status === "no-permission"
        ? "Az értesítések nincsenek engedélyezve ezen az eszközön, ezért nem fogsz értesítést kapni."
        : status === "failed"
          ? "Az emlékeztetőt nem sikerült beállítani."
          : null,
    );
  };

  const handlePreset = async (preset: ReminderPreset) => {
    const at = reminderTimeFor(preset);
    const remindAt = at.toISOString();
    // Moving a reminder that is already set to a later time is putting it off.
    const postponed = !!task.remindAt && at.getTime() > new Date(task.remindAt).getTime();
    dispatch(
      postponed
        ? snoozeTask({ id: task.id, remindAt, preset })
        : setTaskReminder({ id: task.id, remindAt, preset }),
    );
    reportStatus(await scheduleTaskReminder(task.id, task.title, at));
  };

  const handleClearReminder = () => {
    dispatch(setTaskReminder({ id: task.id, remindAt: null }));
    cancelTaskReminder(task.id);
    setReminderNote(null);
  };

  const handleDelete = () => {
    cancelTaskReminder(task.id);
    dispatch(deleteTask(task.id));
    onDismiss();
  };

  const handleSearch = () => {
    Linking.openURL(googleSearchUrl(task.title)).catch(() => {});
  };

  const handleDismiss = () => {
    // An unsaved title edit is dropped, like the mantra's.
    onDismiss();
  };

  return (
    <KeyboardAwareModal
      visible
      onDismiss={handleDismiss}
      contentContainerStyle={modalContainerStyle}
    >
      <ModalCard style={{ maxHeight: (windowHeight - keyboardHeight) * 0.9 }}>
        <ScrollView keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {editingTitle ? (
              <TextInput
                dense
                autoFocus
                label="Mit szeretnél elvégezni?"
                value={titleDraft}
                onChangeText={setTitleDraft}
                onSubmitEditing={saveTitle}
                returnKeyType="done"
                style={{ flex: 1, backgroundColor: "transparent" }}
              />
            ) : (
              <Text variant="titleLarge" style={{ flex: 1 }}>
                {task.title}
              </Text>
            )}
            <IconButton
              icon={editingTitle ? "check" : "pencil"}
              accessibilityLabel={editingTitle ? "Cím mentése" : "Cím szerkesztése"}
              onPress={editingTitle ? saveTitle : startEditTitle}
            />
          </View>
          {subtasks.length === 0 && (
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant, marginTop: Spacing.xs }}
            >
              Nehéz belekezdeni? Bontsd apró lépésekre.
            </Text>
          )}
          {subtasks.map((sub) => (
            <View
              key={sub.id}
              style={{ flexDirection: "row", alignItems: "center", gap: Spacing.xs }}
            >
              <TouchableRipple
                onPress={() => handleToggleSubtask(sub.id)}
                accessibilityLabel={sub.title}
                style={{ flex: 1, borderRadius: BorderRadius.sm }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: Spacing.sm,
                    gap: Spacing.md,
                  }}
                >
                  <Icon
                    source={sub.checked ? "check-circle" : "checkbox-blank-circle-outline"}
                    size={22}
                    color={sub.checked ? theme.colors.primary : theme.colors.onSurfaceVariant}
                  />
                  <Text
                    variant="bodyMedium"
                    style={{
                      flex: 1,
                      textDecorationLine: sub.checked ? "line-through" : "none",
                      color: sub.checked
                        ? theme.colors.onSurfaceVariant
                        : theme.colors.onSurface,
                    }}
                  >
                    {sub.title}
                  </Text>
                </View>
              </TouchableRipple>
              <IconButton
                icon="close"
                size={18}
                accessibilityLabel={`${sub.title} törlése`}
                onPress={() => dispatch(deleteSubtask({ taskId: task.id, subtaskId: sub.id }))}
              />
            </View>
          ))}
          <TextInput
            mode="flat"
            dense
            label={
              subtasks.length === 0
                ? "Mi lenne az első kicsi lépés?"
                : "Újabb lépés"
            }
            value={newSubtask}
            onChangeText={setNewSubtask}
            onSubmitEditing={handleAddSubtask}
            returnKeyType="done"
            submitBehavior="submit"
            style={{ backgroundColor: "transparent" }}
            right={
              <TextInput.Icon
                icon="plus"
                onPress={handleAddSubtask}
                disabled={!newSubtask.trim()}
              />
            }
          />

          <Text variant="titleSmall" style={{ marginTop: Spacing.lg }}>
            Emlékeztető {task.remindAt && "- " + formatRemindAt(task.remindAt)}
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: Spacing.sm,
              marginTop: Spacing.sm,
            }}
          >
            {REMINDER_PRESETS.filter(preset=>preset.key == task.remindPreset || !task.remindPreset).map((preset) =>
              task.remindPreset === preset.key ? (
                // The chosen reminder looks different and carries its own cancel.
                <Chip
                  key={preset.key}
                  showSelectedOverlay
                  selected
                  icon="bell"
                  onPress={() => {}}
                  onClose={handleClearReminder}
                  closeIconAccessibilityLabel={`${preset.label} emlékeztető törlése`}
                >
                  {preset.label}
                </Chip>
              ) : (
                <Chip key={preset.key} onPress={() => handlePreset(preset.key)}>
                  {preset.label}
                </Chip>
              ),
            )}
          </View>
          {reminderNote && (
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.error, marginTop: Spacing.xs }}
            >
              {reminderNote}
            </Text>
          )}

          <View style={{ marginTop: Spacing.lg }}>
            {confirmDelete ? (
              <View style={{ gap: Spacing.sm }}>
                <Text variant="bodyMedium">Biztosan törlöd ezt a feladatot?</Text>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "flex-end",
                    gap: Spacing.sm,
                  }}
                >
                  <Button onPress={() => setConfirmDelete(false)}>Mégse</Button>
                  <Button
                    mode="contained"
                    buttonColor={theme.colors.error}
                    onPress={handleDelete}
                  >
                    Törlés
                  </Button>
                </View>
              </View>
            ) : (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Button
                  icon="delete-outline"
                  textColor={theme.colors.error}
                  onPress={() => setConfirmDelete(true)}
                >
                  Feladat törlése
                </Button>
                <Button mode="contained-tonal" icon="magnify" onPress={handleSearch}>
                  Keress rá
                </Button>
              </View>
            )}
          </View>
        </ScrollView>
      </ModalCard>
    </KeyboardAwareModal>
  );
}
