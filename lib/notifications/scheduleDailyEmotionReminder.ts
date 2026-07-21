import * as Notifications from "expo-notifications";

const ID = "daily-emotion-reminder";
const REMINDER_HOUR = 20;
const REMINDER_MINUTE = 0;

function nextReminderDate(skipToday: boolean): Date {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate(), REMINDER_HOUR, REMINDER_MINUTE, 0, 0);
  if (skipToday || next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

/**
 * Schedules the next occurrence of the daily "how are you" reminder.
 * Pass skipToday=true to skip straight to tomorrow's occurrence (used when
 * the user has already logged their emotion for today).
 */
export async function scheduleDailyEmotionReminder(skipToday = false) {
  await cancelDailyEmotionReminder();
  await Notifications.scheduleNotificationAsync({
    identifier: ID,
    content: {
      title: "Hogy vagy?",
      body: "Mesélj a napodról, ha van egy perced!",
      data: { url: "/me" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: nextReminderDate(skipToday),
    },
  });
}

export async function cancelDailyEmotionReminder() {
  await Notifications.cancelScheduledNotificationAsync(ID).catch(() => {});
  await Notifications.dismissNotificationAsync(ID).catch(() => {});
}
