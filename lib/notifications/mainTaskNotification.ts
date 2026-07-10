import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const ID = "main-task-notification";
const CHANNEL_ID = "main-task";

async function ensureMainTaskChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "Fő feladat",
    importance: Notifications.AndroidImportance.HIGH,
  });
}

/** Shows (or updates) a non-dismissible notification for the current main task. */
export async function showMainTaskNotification(title: string) {
  await ensureMainTaskChannel();
  await Notifications.scheduleNotificationAsync({
    identifier: ID,
    content: {
      title: "Mai fő feladat",
      body: title,
      data: { url: "/me" },
      sticky: true,
      autoDismiss: false,
    },
    trigger: { channelId: CHANNEL_ID },
  });
}

export async function clearMainTaskNotification() {
  await Notifications.dismissNotificationAsync(ID).catch(() => {});
  await Notifications.cancelScheduledNotificationAsync(ID).catch(() => {});
}
