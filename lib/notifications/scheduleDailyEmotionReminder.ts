import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { hasNotificationPermission } from "./registerForPushNotifications";

const ID = "daily-emotion-reminder";
const CHANNEL_ID = "daily-emotion-reminder";
const HOUR = 20;
const MINUTE = 0;

/**
 * What happened to the device's copy of the evening reminder.
 *
 * It is worth reporting rather than swallowing: "the preference is on" and
 * "something will actually arrive at eight" are two different facts, and the
 * gap between them is invisible from the settings screen.
 */
export type ReminderStatus =
  | "scheduled"
  | "already-scheduled"
  | "cancelled"
  | "no-permission"
  | "failed";

/**
 * Android shows nothing at all for a notification whose channel does not
 * exist, so the channel is created before the first schedule rather than left
 * to the fallback one.
 */
async function ensureChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "Napi kérdés",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/** Is the reminder actually on the device's schedule right now? */
export async function isDailyEmotionReminderScheduled(): Promise<boolean> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync().catch(
    () => [],
  );
  return scheduled.some((notification) => notification.identifier === ID);
}

/**
 * Schedule the evening reminder, and report whether it was actually scheduled.
 *
 * The OS grant is checked rather than requested: requesting belongs to the
 * moment the user turns the preference on, not to every app start. But the
 * preference can be on without the grant — turned on from another device, or
 * revoked in the system settings, or reset by a reinstall (Android 13+) — and a
 * scheduled notification is then dropped in silence. Checking is what separates
 * "scheduled" from "stored as on and never delivered".
 *
 * Nothing is cancelled until we know the grant is there. Cancelling first used
 * to mean that a single unreadable permission — and the check is a call into
 * the OS, so it can fail on its own — wiped a working reminder and put nothing
 * back, leaving the user with a switch that said "on" and no reminder for as
 * long as they stayed logged in.
 */
export async function scheduleDailyEmotionReminder(): Promise<ReminderStatus> {
  try {
    if (!(await hasNotificationPermission())) {
      console.warn(
        "Daily emotion reminder not scheduled: the OS notification permission is missing. " +
          "The preference is on, but nothing can be delivered until it is granted in system settings.",
      );
      return "no-permission";
    }

    await ensureChannel();
    await cancelDailyEmotionReminder();
    await Notifications.scheduleNotificationAsync({
      identifier: ID,
      content: {
        title: "Hogy vagy?",
        body: "Mesélj a napodról, ha van egy perced!",
        data: { url: "/me" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: HOUR,
        minute: MINUTE,
        ...(Platform.OS === "android" ? { channelId: CHANNEL_ID } : {}),
      },
    });

    console.log(
      `Daily emotion reminder scheduled for ${HOUR}:${String(MINUTE).padStart(2, "0")}`,
    );
    return "scheduled";
  } catch (error) {
    console.warn("Could not schedule the daily emotion reminder:", error);
    return "failed";
  }
}

export async function cancelDailyEmotionReminder() {
  await Notifications.cancelScheduledNotificationAsync(ID).catch(() => {});
}

/**
 * Make the device's schedule match the stored preference.
 *
 * The schedule is local to the device and nothing on the server knows about
 * it, so it goes missing on its own: an app update, a restore onto a new
 * phone, "clear data", a permission revoked and granted again. Until this
 * existed the reminder was only ever armed while handling a login, so a user
 * who stayed signed in — which is everyone — never got it back.
 *
 * Cheap enough to call on every foreground: one read of the schedule, and a
 * write only when the reminder is genuinely missing.
 */
export async function syncDailyEmotionReminder(
  enabled: boolean,
): Promise<ReminderStatus> {
  if (!enabled) {
    await cancelDailyEmotionReminder();
    return "cancelled";
  }

  try {
    if (await isDailyEmotionReminderScheduled()) return "already-scheduled";
  } catch (error) {
    console.warn("Could not read the notification schedule:", error);
  }

  return scheduleDailyEmotionReminder();
}
