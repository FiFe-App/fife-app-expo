/**
 * Picking a reminder time is what turns notifications on for a task, so it has
 * to ask for the OS permission itself: nothing else in the app has asked yet for
 * someone who never enabled the evening reminder.
 */
import { Platform } from "react-native";

jest.mock("expo-notifications", () => ({
  requestPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
  scheduleNotificationAsync: jest.fn(async () => "id"),
  cancelScheduledNotificationAsync: jest.fn(async () => {}),
  setNotificationChannelAsync: jest.fn(async () => null),
  SchedulableTriggerInputTypes: { DATE: "date" },
  AndroidImportance: { DEFAULT: 3 },
}));
jest.mock("@/lib/notifications/registerForPushNotifications", () => ({
  hasNotificationPermission: jest.fn(async () => false),
}));

import * as Notifications from "expo-notifications";

import { hasNotificationPermission } from "@/lib/notifications/registerForPushNotifications";
import { scheduleTaskReminder } from "@/lib/notifications/scheduleTaskReminder";

const request = Notifications.requestPermissionsAsync as jest.Mock;
const schedule = Notifications.scheduleNotificationAsync as jest.Mock;
const hasPermission = hasNotificationPermission as jest.Mock;

const at = new Date(2026, 9, 30, 9, 0);

beforeEach(() => {
  jest.clearAllMocks();
  hasPermission.mockResolvedValue(false);
  request.mockResolvedValue({ status: "granted" });
  Platform.OS = "ios";
});

describe("scheduleTaskReminder", () => {
  it("asks for the permission when it is missing, then schedules at the chosen time", async () => {
    await expect(scheduleTaskReminder("t1", "Adóbevallás", at)).resolves.toBe("scheduled");

    expect(request).toHaveBeenCalled();
    expect(schedule).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: "task-reminder-t1",
        content: expect.objectContaining({ body: "Adóbevallás" }),
        trigger: expect.objectContaining({ type: "date", date: at }),
      }),
    );
  });

  it("does not ask again when the permission is already granted", async () => {
    hasPermission.mockResolvedValue(true);

    await scheduleTaskReminder("t1", "Adóbevallás", at);

    expect(request).not.toHaveBeenCalled();
    expect(schedule).toHaveBeenCalled();
  });

  it("schedules nothing when the user refuses", async () => {
    request.mockResolvedValue({ status: "denied" });

    await expect(scheduleTaskReminder("t1", "Adóbevallás", at)).resolves.toBe("no-permission");
    expect(schedule).not.toHaveBeenCalled();
  });

  it("schedules nothing on the web, where there are no local notifications", async () => {
    Platform.OS = "web";

    await expect(scheduleTaskReminder("t1", "Adóbevallás", at)).resolves.toBe("no-permission");
    expect(request).not.toHaveBeenCalled();
  });
});
