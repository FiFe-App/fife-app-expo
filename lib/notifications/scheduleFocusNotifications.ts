import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { hasNotificationPermission } from "./registerForPushNotifications";
import { BREAK_END_ID, FOCUS_PREFIX } from "./timerNotificationIds";
import { endOf, Phase, upcomingPhases } from "@/lib/focus/pomodoro";


function contentFor(phase: Phase) {
  switch (phase.kind) {
    case "work":
      return { title: "Vissza a munkához!", body: `Jöhet a ${phase.round}. kör: 25 perc fókusz.` };
    case "shortBreak":
      return { title: "Szünet!", body: "Pihenj 5 percet." };
    case "longBreak":
      return { title: "Hosszú szünet!", body: "Megérdemelsz 15 perc pihenőt." };
  }
}

const at = (date: number) => ({
  type: Notifications.SchedulableTriggerInputTypes.DATE,
  date,
}) as const;

/**
 * Schedule a notification for every upcoming phase change of the Pomodoro
 * timer, and one for its end. They are all scheduled up front because the JS
 * doesn't run while the app is in the background — the OS has to deliver them
 * on its own. Returns whether anything was scheduled.
 */
export async function scheduleFocusNotifications(startedAt: number, rounds: number): Promise<boolean> {
  await cancelFocusNotifications();
  if (Platform.OS === "web") return false;
  if (!(await hasNotificationPermission())) return false;

  const phases = upcomingPhases(startedAt, rounds, Date.now());
  await Promise.all([
    ...phases.map((phase) =>
      Notifications.scheduleNotificationAsync({
        identifier: `${FOCUS_PREFIX}${phase.index}`,
        content: { ...contentFor(phase), data: { url: "/focus" } },
        trigger: at(phase.startsAt),
      }),
    ),
    Notifications.scheduleNotificationAsync({
      identifier: `${FOCUS_PREFIX}done`,
      content: {
        title: "Kész!",
        body: `Ügyes voltál, letelt mind a ${rounds} kör.`,
        data: { url: "/focus" },
      },
      trigger: at(endOf(startedAt, rounds)),
    }),
  ]);
  return true;
}

export async function cancelFocusNotifications() {
  if (Platform.OS === "web") return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync().catch(() => []);
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith(FOCUS_PREFIX))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {})),
  );
}

export async function scheduleBreakEndNotification(endsAt: number): Promise<boolean> {
  await cancelBreakEndNotification();
  if (Platform.OS === "web") return false;
  if (!(await hasNotificationPermission())) return false;
  await Notifications.scheduleNotificationAsync({
    identifier: BREAK_END_ID,
    content: { title: "Vége a szünetnek", body: "Remélem, jól esett a pihenés!", data: { url: "/szunet" } },
    trigger: at(endsAt),
  });
  return true;
}

export async function cancelBreakEndNotification() {
  if (Platform.OS === "web") return;
  await Notifications.cancelScheduledNotificationAsync(BREAK_END_ID).catch(() => {});
}
