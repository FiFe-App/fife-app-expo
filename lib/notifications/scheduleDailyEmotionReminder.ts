import * as Notifications from "expo-notifications";

const ID = "daily-emotion-reminder";

export async function scheduleDailyEmotionReminder() {
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
      hour: 20,
      minute: 0,
    },
  });
}

export async function cancelDailyEmotionReminder() {
  await Notifications.cancelScheduledNotificationAsync(ID).catch(() => {});
}
