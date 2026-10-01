import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { hasNotificationPermission } from "./registerForPushNotifications";

const ID = "daily-emotion-reminder";
const TEST_ID = "daily-emotion-reminder-test";
const CHANNEL_ID = "daily-emotion-reminder";
export const REMINDER_HOUR = 20;
export const REMINDER_MINUTE = 0;
const HOUR = REMINDER_HOUR;
const MINUTE = REMINDER_MINUTE;

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

/** When the reminder is due next, by the device's clock. */
export const nextReminderTime = (now: Date = new Date()): Date => {
  const next = new Date(now);
  next.setHours(HOUR, MINUTE, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return next;
};

/**
 * Is the reminder on the device's schedule right now?
 *
 * Careful with what this proves. On Android it reads expo-notifications' own
 * stored list of scheduled requests, which is not the same thing as the alarm
 * the system is holding: a force stop, a "clear cache", or one of the cleaner
 * apps OEMs ship can take the alarm away and leave the request behind. So this
 * answers "does the app think so", which is useful for telling the user what is
 * going on — and useless as a reason to skip re-scheduling.
 */
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
 * phone, "clear data", a permission revoked and granted again.
 *
 * It re-schedules every time rather than checking first and skipping. The
 * check can only ask expo-notifications whether it still *remembers* the
 * request (see isDailyEmotionReminderScheduled), and the phones this went
 * wrong on are exactly the ones where the remembered request outlives the
 * system alarm — so "already scheduled" was an excuse to never arm it again.
 * Setting an alarm that is already set costs nothing and fixes that.
 */
export async function syncDailyEmotionReminder(
  enabled: boolean,
): Promise<ReminderStatus> {
  if (!enabled) {
    await cancelDailyEmotionReminder();
    return "cancelled";
  }

  return scheduleDailyEmotionReminder();
}

/**
 * What is actually true about the reminder on this device, for the line under
 * the switch in Profil → Beállítások.
 *
 * "The switch is on and nothing arrives" has several causes that look
 * identical from the outside — no OS permission, the channel muted by hand,
 * the app's own scheduling failing — and none of them are visible to the
 * person they are happening to.
 */
export interface ReminderDiagnostics {
  permissionGranted: boolean;
  /** The app believes the reminder is scheduled (see the caveat above). */
  scheduled: boolean;
  /** Android only: the user muted this notification channel by hand. */
  channelMuted: boolean;
  nextAt: Date;
}

export async function getReminderDiagnostics(): Promise<ReminderDiagnostics> {
  const permissionGranted = await hasNotificationPermission().catch(() => false);
  const scheduled = await isDailyEmotionReminderScheduled().catch(() => false);

  let channelMuted = false;
  if (Platform.OS === "android") {
    try {
      const channel = await Notifications.getNotificationChannelAsync(CHANNEL_ID);
      // A channel the user has switched off keeps existing, with importance
      // NONE. The app's own permission still reads as granted.
      channelMuted =
        !!channel && channel.importance === Notifications.AndroidImportance.NONE;
    } catch {
      // No channel yet — nothing has been scheduled on this device.
    }
  }

  return { permissionGranted, scheduled, channelMuted, nextAt: nextReminderTime() };
}

/**
 * Fires a notification in a few seconds, on the same channel as the reminder.
 *
 * The one question nobody can answer from the outside: does a local
 * notification reach this phone at all? If this arrives and the evening one
 * never does, the app's scheduling is fine and the phone is dropping the alarm
 * — which is worth knowing before anybody looks at the code again.
 */
export async function sendReminderTestNotification(): Promise<ReminderStatus> {
  try {
    if (!(await hasNotificationPermission())) return "no-permission";
    await ensureChannel();
    await Notifications.scheduleNotificationAsync({
      identifier: TEST_ID,
      content: {
        title: "Teszt értesítés",
        body: "Ha ezt látod, a telefonod megjeleníti az emlékeztetőket.",
        data: { url: "/me" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 10,
        ...(Platform.OS === "android" ? { channelId: CHANNEL_ID } : {}),
      },
    });
    return "scheduled";
  } catch (error) {
    console.warn("Could not send the test notification:", error);
    return "failed";
  }
}
