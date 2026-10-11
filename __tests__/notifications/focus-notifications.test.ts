import * as Notifications from "expo-notifications";
import { hasNotificationPermission } from "@/lib/notifications/registerForPushNotifications";
import {
  cancelBreakEndNotification,
  cancelFocusNotifications,
  scheduleBreakEndNotification,
  scheduleFocusNotifications,
} from "@/lib/notifications/scheduleFocusNotifications";
import { isTimerNotification } from "@/lib/notifications/timerNotificationIds";

jest.mock("expo-notifications", () => ({
  SchedulableTriggerInputTypes: { DATE: "date" },
  scheduleNotificationAsync: jest.fn().mockResolvedValue("id"),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  getAllScheduledNotificationsAsync: jest.fn().mockResolvedValue([]),
}));
jest.mock("@/lib/notifications/registerForPushNotifications", () => ({
  hasNotificationPermission: jest.fn(),
}));

const schedule = Notifications.scheduleNotificationAsync as jest.Mock;
const cancel = Notifications.cancelScheduledNotificationAsync as jest.Mock;
const getAll = Notifications.getAllScheduledNotificationsAsync as jest.Mock;
const hasPermission = hasNotificationPermission as jest.Mock;
const MIN = 60 * 1000;

beforeEach(() => jest.clearAllMocks());

it("schedules nothing without the OS permission", async () => {
  hasPermission.mockResolvedValue(false);
  expect(await scheduleFocusNotifications(Date.now(), 4)).toBe(false);
  expect(await scheduleBreakEndNotification(Date.now() + MIN)).toBe(false);
  expect(schedule).not.toHaveBeenCalled();
});

it("schedules every phase change of the chosen rounds, then the end", async () => {
  hasPermission.mockResolvedValue(true);
  const start = Date.now();
  expect(await scheduleFocusNotifications(start, 3)).toBe(true);

  // 3 rounds: W S W S W → 4 changes + the end.
  const calls = schedule.mock.calls.map((c) => c[0]);
  expect(calls).toHaveLength(5);
  expect(calls[0]).toMatchObject({
    identifier: "focus-1",
    content: { title: "Szünet!", data: { url: "/focus" } },
    trigger: { type: "date", date: start + 25 * MIN },
  });
  expect(calls[1].content.title).toBe("Vissza a munkához!");
  expect(calls[4]).toMatchObject({
    identifier: "focus-done",
    content: { title: "Kész!" },
    trigger: { date: start + (3 * 25 + 2 * 5) * MIN },
  });
});

it("schedules the end of a break and cancels it", async () => {
  hasPermission.mockResolvedValue(true);
  const endsAt = Date.now() + 15 * MIN;
  await scheduleBreakEndNotification(endsAt);
  expect(schedule.mock.calls[0][0]).toMatchObject({
    identifier: "break-end",
    trigger: { type: "date", date: endsAt },
  });
  cancel.mockClear();
  await cancelBreakEndNotification();
  expect(cancel).toHaveBeenCalledWith("break-end");
});

it("cancels only the focus notifications", async () => {
  getAll.mockResolvedValue([
    { identifier: "focus-1" },
    { identifier: "daily-emotion-reminder" },
    { identifier: "focus-done" },
  ]);
  await cancelFocusNotifications();
  expect(cancel.mock.calls.map((c) => c[0])).toEqual(["focus-1", "focus-done"]);
});

it("recognises the timer notifications, and only those", () => {
  expect(isTimerNotification("focus-3")).toBe(true);
  expect(isTimerNotification("break-end")).toBe(true);
  expect(isTimerNotification("daily-emotion-reminder")).toBe(false);
});
