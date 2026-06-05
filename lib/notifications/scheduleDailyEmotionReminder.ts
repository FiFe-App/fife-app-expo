import * as Notifications from "expo-notifications";

const EMOTION_NOTIFICATION_ID_PREFIX = "emotion-daily-reminder";

export async function scheduleDailyEmotionReminder() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const alreadyScheduled = scheduled.some((n) =>
    n.identifier.startsWith(EMOTION_NOTIFICATION_ID_PREFIX)
  );
  if (alreadyScheduled) return;

  await Notifications.scheduleNotificationAsync({
    identifier: EMOTION_NOTIFICATION_ID_PREFIX,
    content: {
      title: "Milyen napod volt ma?",
      body: "Értékeld a napodat! 😊",
      data: { url: "/home" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 0,
    },
  });
}

export async function cancelDailyEmotionReminder() {
  await Notifications.cancelScheduledNotificationAsync(EMOTION_NOTIFICATION_ID_PREFIX);
}
