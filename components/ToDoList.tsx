import { useRef, useState } from "react";
import { View } from "react-native";
import { Icon, Portal, Surface, Text, TextInput, TouchableRipple } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { TaskItem } from "@/redux/store.type";
import { addTask, setTaskReminder, toggleTask } from "@/redux/reducers/userReducer";
import { cancelTaskReminder } from "@/lib/notifications/scheduleTaskReminder";
import { useExpireTaskReminders } from "@/hooks/useExpireTaskReminders";
import TaskModal from "./TaskModal";
import { Spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/borderRadius";
import { useAppTheme } from "@/assets/theme";
import { ThemedText } from "./ThemedText";

interface ToDoListProps {
  // Called with the input's container ref when it's focused, so a parent
  // ScrollView can scroll it above the keyboard. Needed on edge-to-edge
  // Android, where the window does not resize and a KeyboardAvoidingView
  // alone cannot reveal an input inside scroll content.
  onInputFocus?: (containerRef: React.RefObject<View | null>) => void;
}

export default function ToDoList({ onInputFocus }: ToDoListProps) {
  const theme = useAppTheme();
  const dispatch = useDispatch();
  const tasks = useSelector((state: RootState) => state.user.tasks) ?? [];
  useExpireTaskReminders();
  // Tasks already checked at mount stay hidden; ones checked during this
  // session stay in place.
  const [hiddenIds] = useState(() =>
    tasks.filter((task) => task.checked).map((task) => task.id),
  );
  const [newTitle, setNewTitle] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const inputContainerRef = useRef<View>(null);

  const handleToggle = (task: TaskItem) => {
    dispatch(toggleTask(task.id));
    // A finished task has nothing left to be reminded of.
    if (!task.checked && task.remindAt) {
      dispatch(setTaskReminder({ id: task.id, remindAt: null }));
      cancelTaskReminder(task.id);
    }
  };

  const visibleTasks = tasks.filter((task) => !hiddenIds.includes(task.id));

  const handleAdd = () => {
    const title = newTitle.trim();
    if (!title) return;
    dispatch(
      addTask({
        id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        title,
        checked: false,
      }),
    );
    setNewTitle("");
  };

  return (
    <View style={{ gap: Spacing.sm }}>
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: Spacing.xs }}>
        <ThemedText variant="labelLarge" type="bold" style={{ color: theme.colors.secondary }}>
          Lusta Lista
        </ThemedText>
      </View>
        <ThemedText variant="labelSmall">
          Mik azok a feladatok amiket mindig elnapolsz?
        </ThemedText>
      <Surface
        style={{
          flexDirection: "column",
          borderRadius: BorderRadius.lg,
          paddingVertical: Spacing.md,
          paddingHorizontal: Spacing.lg,
          width: "100%",
        }}
        elevation={0}
      >
        {/* Above the tasks, so a long list never pushes it out of reach. */}
        <View ref={inputContainerRef}>
          <TextInput
            mode="flat"
            dense
            label="Mit szeretnél végre elvégezni?"
            value={newTitle}
            onChangeText={setNewTitle}
            onSubmitEditing={handleAdd}
            onFocus={() => onInputFocus?.(inputContainerRef)}
            returnKeyType="done"
            submitBehavior="submit"
            style={{
              backgroundColor: "transparent",
              marginBottom: visibleTasks.length ? Spacing.xs : 0,
            }}
            right={
              <TextInput.Icon icon="plus" onPress={handleAdd} disabled={!newTitle.trim()} />
            }
          />
        </View>
        {visibleTasks.map((task) => {
          const subtasks = task.subtasks ?? [];
          const doneSubtasks = subtasks.filter((sub) => sub.checked).length;
          return (
            <View
              key={task.id}
              style={{ flexDirection: "row", alignItems: "center", gap: Spacing.xs }}
            >
              {/* The row opens the task; only the icon ticks it off. */}
              <TouchableRipple
                onPress={() => setSelectedId(task.id)}
                accessibilityLabel={task.title}
                style={{ flex: 1, borderRadius: BorderRadius.sm }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: Spacing.sm,
                    gap: Spacing.sm,
                  }}
                >
                  <Text
                    variant="bodyLarge"
                    style={{
                      flexShrink: 1,
                      textDecorationLine: task.checked ? "line-through" : "none",
                      color: task.checked
                        ? theme.colors.onSurfaceVariant
                        : theme.colors.onSurface,
                    }}
                  >
                    {task.title}
                  </Text>
                  {subtasks.length > 0 && (
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {doneSubtasks}/{subtasks.length}
                    </Text>
                  )}
                  {task.remindAt && !task.checked && (
                    <Icon source="bell-outline" size={16} color={theme.colors.onSurfaceVariant} />
                  )}
                </View>
              </TouchableRipple>
              <TouchableRipple
                onPress={() => handleToggle(task)}
                accessibilityLabel={task.checked ? "Visszanyitás" : "Kipipálás"}
                borderless
                style={{ borderRadius: BorderRadius.xl, padding: Spacing.xs }}
              >
                <Icon
                  source={task.checked ? "check-circle" : "checkbox-blank-circle-outline"}
                  size={24}
                  color={task.checked ? theme.colors.primary : theme.colors.onSurfaceVariant}
                />
              </TouchableRipple>
            </View>
          );
        })}
      </Surface>
      <Portal>
        <TaskModal taskId={selectedId} onDismiss={() => setSelectedId(null)} />
      </Portal>
    </View>
  );
}
