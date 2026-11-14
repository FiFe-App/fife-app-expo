import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { ReminderPreset } from "@/redux/store.type";
import { hasNotificationPermission } from "./registerForPushNotifications";

const CHANNEL_ID = "task-reminder";
const idFor = (taskId: string) => `task-reminder-${taskId}`;

export type TaskReminderStatus = "scheduled" | "cancelled" | "no-permission" | "failed";

/** Reminders at these hours are the ones people can plausibly act on. */
const MORNING_HOUR = 9;
const EVENING_HOUR = 19;

export type { ReminderPreset };

export const REMINDER_PRESETS: { key: ReminderPreset; label: string }[] = [
  { key: "hour", label: "1 óra múlva" },
  //{ key: "minute", label: "1 perc teszt" },
  { key: "evening", label: "Ma este" },
  { key: "tomorrow", label: "Holnap reggel" },
  { key: "weekend", label: "Hétvégén" },
];

/**
 * The moment a quick-pick stands for, by the device's clock. "Ma este" after
 * the evening hour has passed rolls to tomorrow evening rather than landing in
 * the past, where the OS would drop or fire it at once.
 */
export function reminderTimeFor(preset: ReminderPreset, now: Date = new Date()): Date {
  const at = new Date(now);
  switch (preset) {
    case "hour":
      at.setTime(now.getTime() + 60 * 60 * 1000);
      return at;
    case "minute":
      at.setTime(now.getTime() + 1000);
      return at;
    case "evening":
      at.setHours(EVENING_HOUR, 0, 0, 0);
      if (at.getTime() <= now.getTime()) at.setDate(at.getDate() + 1);
      return at;
    case "tomorrow":
      at.setDate(at.getDate() + 1);
      at.setHours(MORNING_HOUR, 0, 0, 0);
      return at;
    case "weekend": {
      // Next Saturday morning; on a Saturday after the morning, the following one.
      const daysUntilSaturday = (6 - now.getDay() + 7) % 7;
      at.setDate(at.getDate() + daysUntilSaturday);
      at.setHours(MORNING_HOUR, 0, 0, 0);
      if (at.getTime() <= now.getTime()) at.setDate(at.getDate() + 7);
      return at;
    }
  }
}

async function ensureChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "Lusta Lista emlékeztető",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function cancelTaskReminder(taskId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(idFor(taskId)).catch(() => {});
}

/**
 * Picking a reminder time is the moment the user opts in, so this is where the
 * OS permission is asked for. Unlike the evening reminder there is no switch in
 * the settings that would have asked already — without this, a user who never
 * turned that one on would pick a time and silently never be notified.
 */
async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  if (await hasNotificationPermission()) return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

/**
 * Schedules a one-off local notification for the task, replacing any earlier
 * one. The schedule is local to this device; `remindAt` syncs with the task but
 * the alarm does not. The reminder time is stored either way; the returned
 * status says whether anything will actually arrive.
 */
export async function scheduleTaskReminder(
  taskId: string,
  title: string,
  at: Date,
): Promise<TaskReminderStatus> {
  try {
    if (!(await ensurePermission())) return "no-permission";
    await ensureChannel();
    await cancelTaskReminder(taskId);
    await Notifications.scheduleNotificationAsync({
      identifier: idFor(taskId),
      content: {
        title: "Lusta Lista",
        body: title,
        data: { url: "/me" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: at,
        ...(Platform.OS === "android" ? { channelId: CHANNEL_ID } : {}),
      },
    });
    return "scheduled";
  } catch (error) {
    console.warn("Could not schedule the task reminder:", error);
    return "failed";
  }
}
