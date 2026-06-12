import { useState } from "react";
import { View } from "react-native";
import { Icon, Surface, Text, TextInput, TouchableRipple } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { addTask, toggleTask } from "@/redux/reducers/userReducer";
import { Spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/borderRadius";
import { useAppTheme } from "@/assets/theme";
import { ThemedText } from "./ThemedText";

export default function ToDoList() {
  const theme = useAppTheme();
  const dispatch = useDispatch();
  const tasks = useSelector((state: RootState) => state.user.tasks) ?? [];
  // Tasks already checked at mount stay hidden; ones checked during this
  // session stay in place.
  const [hiddenIds] = useState(() =>
    tasks.filter((task) => task.checked).map((task) => task.id),
  );
  const [newTitle, setNewTitle] = useState("");

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
          Feladataid
        </ThemedText>
      </View>
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
        {visibleTasks.map((task) => (
          <TouchableRipple
            key={task.id}
            onPress={() => dispatch(toggleTask(task.id))}
            style={{ borderRadius: BorderRadius.sm }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: Spacing.sm,
                gap: Spacing.md,
              }}
            >
              <Text
                variant="bodyLarge"
                style={{
                  flex: 1,
                  textDecorationLine: task.checked ? "line-through" : "none",
                  color: task.checked ? theme.colors.onSurfaceVariant : theme.colors.onSurface,
                }}
              >
                {task.title}
              </Text>
              <View style={{ alignSelf: "flex-end" }}>
                <Icon
                  source={task.checked ? "check-circle" : "checkbox-blank-circle-outline"}
                  size={24}
                  color={task.checked ? theme.colors.primary : theme.colors.onSurfaceVariant}
                />
              </View>
            </View>
          </TouchableRipple>
        ))}
        <TextInput
          mode="flat"
          dense
          label="Új feladat"
          value={newTitle}
          onChangeText={setNewTitle}
          onSubmitEditing={handleAdd}
          style={{
            backgroundColor: "transparent",
            marginTop: visibleTasks.length ? Spacing.xs : 0,
          }}
          right={
            <TextInput.Icon icon="plus" onPress={handleAdd} disabled={!newTitle.trim()} />
          }
        />
      </Surface>
    </View>
  );
}
