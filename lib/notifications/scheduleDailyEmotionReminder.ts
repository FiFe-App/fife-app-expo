import * as Notifications from "expo-notifications";
import { hasNotificationPermission } from "./registerForPushNotifications";

const ID = "daily-emotion-reminder";
const HOUR = 20;
const MINUTE = 0;

/**
 * Schedule the evening reminder, and report whether it was actually scheduled.
 *
 * The OS grant is checked rather than requested: requesting belongs to the
 * moment the user turns the preference on, not to every app start. But the
 * preference can be on without the grant — turned on from another device, or
 * revoked in the system settings, or reset by a reinstall (Android 13+) — and a
 * scheduled notification is then dropped in silence. Checking is what separates
 * "scheduled" from "stored as on and never delivered".
 */
export async function scheduleDailyEmotionReminder(): Promise<boolean> {
  await cancelDailyEmotionReminder();

  if (!(await hasNotificationPermission())) {
    console.warn(
      "Daily emotion reminder not scheduled: the OS notification permission is missing. " +
        "The preference is on, but nothing can be delivered until it is granted in system settings.",
    );
    return false;
  }

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
    },
  });

  // The only way to tell from outside whether the reminder actually exists.
  const scheduled = await Notifications.getAllScheduledNotificationsAsync().catch(() => []);
  console.log(
    `Daily emotion reminder scheduled for ${HOUR}:${String(MINUTE).padStart(2, "0")} ` +
      `(${scheduled.length} scheduled notification(s) on this device)`,
  );
  return true;
}

export async function cancelDailyEmotionReminder() {
  await Notifications.cancelScheduledNotificationAsync(ID).catch(() => {});
}
