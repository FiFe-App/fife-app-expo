import * as Notifications from "expo-notifications";
import { hasNotificationPermission } from "@/lib/notifications/registerForPushNotifications";
import {
  cancelFocusNotifications,
  scheduleFocusNotifications,
} from "@/lib/notifications/scheduleFocusNotifications";

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

beforeEach(() => jest.clearAllMocks());

it("schedules nothing without the OS permission", async () => {
  hasPermission.mockResolvedValue(false);
  expect(await scheduleFocusNotifications(Date.now())).toBe(false);
  expect(schedule).not.toHaveBeenCalled();
});

it("schedules every upcoming phase change, the first being the break", async () => {
  hasPermission.mockResolvedValue(true);
  const start = Date.now();
  expect(await scheduleFocusNotifications(start)).toBe(true);

  expect(schedule).toHaveBeenCalledTimes(32);
  const first = schedule.mock.calls[0][0];
  expect(first.identifier).toBe("focus-1");
  expect(first.content).toMatchObject({ title: "Szünet!", data: { url: "/focus" } });
  expect(first.trigger).toEqual({ type: "date", date: start + 25 * 60 * 1000 });
  expect(schedule.mock.calls[1][0].content.title).toBe("Vissza a munkához!");
  expect(schedule.mock.calls[6][0].content.title).toBe("Hosszú szünet!");
});

it("cancels only its own notifications", async () => {
  getAll.mockResolvedValue([
    { identifier: "focus-1" },
    { identifier: "daily-emotion-reminder" },
    { identifier: "focus-2" },
  ]);
  await cancelFocusNotifications();
  expect(cancel.mock.calls.map((c) => c[0])).toEqual(["focus-1", "focus-2"]);
});
