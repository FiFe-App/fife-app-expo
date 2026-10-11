import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { hasNotificationPermission } from "./registerForPushNotifications";
import { Phase, upcomingPhases } from "@/lib/focus/pomodoro";

const ID_PREFIX = "focus-";
/** Four full cycles (~8 hours) — nobody focuses longer than that in one go. */
const AHEAD = 4 * 8;

function contentFor(phase: Phase) {
  switch (phase.kind) {
    case "work":
      return { title: "Vissza a munkához!", body: "Jöhet 25 perc fókusz." };
    case "shortBreak":
      return { title: "Szünet!", body: "Pihenj 5 percet." };
    case "longBreak":
      return { title: "Hosszú szünet!", body: "Megérdemelsz 15 perc pihenőt." };
  }
}

/**
 * Schedule a notification for every upcoming phase change of the Pomodoro
 * timer started at `startedAt`. They are all scheduled up front because the JS
 * doesn't run while the app is in the background — the OS has to deliver them
 * on its own. Returns whether anything was scheduled.
 */
export async function scheduleFocusNotifications(startedAt: number): Promise<boolean> {
  await cancelFocusNotifications();
  if (Platform.OS === "web") return false;
  if (!(await hasNotificationPermission())) return false;

  const phases = upcomingPhases(startedAt, Date.now(), AHEAD);
  await Promise.all(
    phases.map((phase) =>
      Notifications.scheduleNotificationAsync({
        identifier: `${ID_PREFIX}${phase.index}`,
        content: { ...contentFor(phase), data: { url: "/focus" } },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: phase.startsAt,
        },
      }),
    ),
  );
  return true;
}

export async function cancelFocusNotifications() {
  if (Platform.OS === "web") return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync().catch(() => []);
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith(ID_PREFIX))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {})),
  );
}
