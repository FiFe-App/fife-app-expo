import { useState } from "react";
import { Pressable, View } from "react-native";
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from "react-native-draggable-flatlist";
import { Button, Dialog, Divider, Icon, IconButton, Portal, Surface, Switch, Text, TextInput, TouchableRipple } from "react-native-paper";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { addTask, reorderTasks, setMainTaskNotificationEnabled, toggleTask } from "@/redux/reducers/userReducer";
import { Spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/borderRadius";
import { useAppTheme } from "@/assets/theme";
import { ThemedText } from "./ThemedText";
import { TaskItem } from "@/redux/store.type";

export default function ToDoList() {
  const theme = useAppTheme();
  const dispatch = useDispatch();
  const tasks = useSelector((state: RootState) => state.user.tasks) ?? [];
  const mainTaskNotificationEnabled = useSelector(
    (state: RootState) => state.user.mainTaskNotificationEnabled ?? true
  );
  // Tasks already checked at mount stay hidden; ones checked during this
  // session stay in place.
  const [hiddenIds] = useState(() =>
    tasks.filter((task) => task.checked).map((task) => task.id),
  );
  const [newTitle, setNewTitle] = useState("");
  const [settingsVisible, setSettingsVisible] = useState(false);

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

  const renderItem = ({ item, drag, isActive, getIndex }: RenderItemParams<TaskItem>) => {
    const isMain = getIndex() === 0;
    return (
      <ScaleDecorator>
        <View>
          {isMain && (
            <ThemedText
              variant="labelSmall"
              type="bold"
              style={{ color: theme.colors.primary, marginBottom: Spacing.xs }}
            >
              Mai fő feladat
            </ThemedText>
          )}
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableRipple
              onPress={() => dispatch(toggleTask(item.id))}
              disabled={isActive}
              style={{
                flex: 1,
                borderRadius: BorderRadius.sm,
                backgroundColor: isMain ? theme.colors.secondaryContainer : "transparent",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: Spacing.sm,
                  paddingHorizontal: isMain ? Spacing.sm : 0,
                  gap: Spacing.md,
                }}
              >
                <Text
                  variant={isMain ? "titleMedium" : "bodyLarge"}
                  style={{
                    flex: 1,
                    textDecorationLine: item.checked ? "line-through" : "none",
                    color: item.checked
                      ? theme.colors.onSurfaceVariant
                      : isMain
                        ? theme.colors.onSecondaryContainer
                        : theme.colors.onSurface,
                  }}
                >
                  {item.title}
                </Text>
                <Icon
                  source={item.checked ? "check-circle" : "checkbox-blank-circle-outline"}
                  size={24}
                  color={
                    item.checked
                      ? theme.colors.primary
                      : isMain
                        ? theme.colors.onSecondaryContainer
                        : theme.colors.onSurfaceVariant
                  }
                />
              </View>
            </TouchableRipple>
            <Pressable
              onLongPress={drag}
              delayLongPress={150}
              hitSlop={8}
              style={{ padding: Spacing.sm }}
            >
              <Icon source="drag-vertical" size={22} color={theme.colors.onSurfaceVariant} />
            </Pressable>
          </View>
          {isMain && <Divider style={{ marginVertical: Spacing.sm }} />}
        </View>
      </ScaleDecorator>
    );
  };

  return (
    <View style={{ gap: Spacing.sm }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: Spacing.xs }}>
          <ThemedText variant="labelLarge" type="bold" style={{ color: theme.colors.secondary }}>
            Lusta Lista
          </ThemedText>
        </View>
        <IconButton
          icon="cog-outline"
          size={20}
          style={{ margin: 0 }}
          onPress={() => setSettingsVisible(true)}
        />
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
        <DraggableFlatList
          data={visibleTasks}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          onDragEnd={({ data }) => dispatch(reorderTasks(data))}
          renderItem={renderItem}
        />
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

      <Portal>
        <Dialog visible={settingsVisible} onDismiss={() => setSettingsVisible(false)}>
          <Dialog.Title>Lusta Lista beállítások</Dialog.Title>
          <Dialog.Content>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: Spacing.md }}>
              <ThemedText style={{ flex: 1 }}>Fő feladat értesítés bekapcsolva?</ThemedText>
              <Switch
                value={mainTaskNotificationEnabled}
                onValueChange={(value) => {
                  dispatch(setMainTaskNotificationEnabled(value));
                }}
              />
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSettingsVisible(false)}>Bezár</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}
