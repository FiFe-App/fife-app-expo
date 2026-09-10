/**
 * The evening "Hogy vagy?" reminder.
 *
 * It is a schedule on the device, not something the server sends, so it goes
 * missing on its own — an app update, a restore onto a new phone, a permission
 * revoked and granted again. What is covered here is the part that failed in
 * the field: the reminder was armed only while handling a login, and once the
 * OS had dropped it, a user who stayed signed in never got it back.
 */
import { act, waitFor } from "@testing-library/react-native";
import { AppState, type AppStateStatus } from "react-native";

jest.mock("expo-notifications", () => ({
  getAllScheduledNotificationsAsync: jest.fn(async () => []),
  scheduleNotificationAsync: jest.fn(async () => "daily-emotion-reminder"),
  cancelScheduledNotificationAsync: jest.fn(async () => {}),
  setNotificationChannelAsync: jest.fn(async () => null),
  setNotificationHandler: jest.fn(),
  SchedulableTriggerInputTypes: { DAILY: "daily" },
  AndroidImportance: { DEFAULT: 3 },
}));
jest.mock("@/lib/notifications/registerForPushNotifications", () => ({
  hasNotificationPermission: jest.fn(async () => true),
}));
// Computed from Platform.OS at import time; the reminder is a native feature
// and these tests are about its logic, not about which platform runs them.
jest.mock("@/constants/emotionTiming", () => ({
  ...jest.requireActual("@/constants/emotionTiming"),
  emotionAvailable: true,
}));

import * as Notifications from "expo-notifications";

import { useDailyEmotionReminder } from "@/hooks/useDailyEmotionReminder";
import { hasNotificationPermission } from "@/lib/notifications/registerForPushNotifications";
import {
  cancelDailyEmotionReminder,
  scheduleDailyEmotionReminder,
  syncDailyEmotionReminder,
} from "@/lib/notifications/scheduleDailyEmotionReminder";
import { DEFAULT_NOTIFICATION_PREFS } from "@/hooks/useNotificationPrefs";
import { login, setNotificationPrefs } from "@/redux/reducers/userReducer";
import {
  createTestStore,
  renderHookWithProviders,
} from "@/test-utils/renderWithProviders";

const scheduled = Notifications.scheduleNotificationAsync as jest.Mock;
const cancelled = Notifications.cancelScheduledNotificationAsync as jest.Mock;
const listScheduled = Notifications.getAllScheduledNotificationsAsync as jest.Mock;
const permission = hasNotificationPermission as jest.Mock;

const reminderIsOnTheDevice = () =>
  listScheduled.mockResolvedValue([{ identifier: "daily-emotion-reminder" }]);
const reminderIsGone = () => listScheduled.mockResolvedValue([]);

beforeEach(() => {
  jest.clearAllMocks();
  permission.mockResolvedValue(true);
  reminderIsGone();
});

describe("scheduleDailyEmotionReminder", () => {
  it("schedules the reminder for eight in the evening", async () => {
    expect(await scheduleDailyEmotionReminder()).toBe("scheduled");

    expect(scheduled).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: "daily-emotion-reminder",
        trigger: expect.objectContaining({ hour: 20, minute: 0 }),
      }),
    );
  });

  it("leaves the existing schedule alone when the OS grant is missing", async () => {
    // The regression this is here for: it used to cancel first and check
    // afterwards, so one unreadable permission wiped a working reminder and
    // put nothing back — a switch that says "on" and a phone that stays quiet.
    permission.mockResolvedValue(false);

    expect(await scheduleDailyEmotionReminder()).toBe("no-permission");

    expect(cancelled).not.toHaveBeenCalled();
    expect(scheduled).not.toHaveBeenCalled();
  });

  it("reports a failure instead of throwing into the caller", async () => {
    scheduled.mockRejectedValueOnce(new Error("no room on the schedule"));

    expect(await scheduleDailyEmotionReminder()).toBe("failed");
  });
});

describe("syncDailyEmotionReminder", () => {
  it("puts the reminder back when the OS has lost it", async () => {
    reminderIsGone();

    expect(await syncDailyEmotionReminder(true)).toBe("scheduled");
    expect(scheduled).toHaveBeenCalled();
  });

  it("leaves a reminder that is already there untouched", async () => {
    reminderIsOnTheDevice();

    expect(await syncDailyEmotionReminder(true)).toBe("already-scheduled");
    expect(scheduled).not.toHaveBeenCalled();
    expect(cancelled).not.toHaveBeenCalled();
  });

  it("cancels it when the preference is off", async () => {
    reminderIsOnTheDevice();

    expect(await syncDailyEmotionReminder(false)).toBe("cancelled");
    expect(cancelled).toHaveBeenCalledWith("daily-emotion-reminder");
    expect(scheduled).not.toHaveBeenCalled();
  });
});

describe("useDailyEmotionReminder", () => {
  const storeWith = (prefs?: Partial<typeof DEFAULT_NOTIFICATION_PREFS>) => {
    const store = createTestStore();
    store.dispatch(login("me"));
    if (prefs)
      store.dispatch(
        setNotificationPrefs({ ...DEFAULT_NOTIFICATION_PREFS, ...prefs }),
      );
    return store;
  };

  it("arms the reminder on a start where nothing about the login changed", async () => {
    // The whole point: the user has been signed in for weeks and the app
    // update wiped the schedule. Nothing here is a login.
    await renderHookWithProviders(() => useDailyEmotionReminder(), {
      store: storeWith({ emotionDailyPrompt: true }),
    });

    await waitFor(() => expect(scheduled).toHaveBeenCalled());
  });

  it("waits for the stored preferences before touching anything", async () => {
    // Not hydrated yet: the defaults say "off", and acting on them would
    // cancel a good reminder on every single start.
    await renderHookWithProviders(() => useDailyEmotionReminder(), {
      store: storeWith(),
    });

    await act(async () => {});
    expect(cancelled).not.toHaveBeenCalled();
    expect(scheduled).not.toHaveBeenCalled();
  });

  it("cancels it for a signed-out device", async () => {
    await renderHookWithProviders(() => useDailyEmotionReminder());

    await waitFor(() =>
      expect(cancelled).toHaveBeenCalledWith("daily-emotion-reminder"),
    );
  });

  it("checks again every time the app comes to the foreground", async () => {
    const listeners: ((state: AppStateStatus) => void)[] = [];
    jest.spyOn(AppState, "addEventListener").mockImplementation(((
      _event: string,
      handler: (state: AppStateStatus) => void,
    ) => {
      listeners.push(handler);
      return { remove: jest.fn() };
    }) as unknown as typeof AppState.addEventListener);

    await renderHookWithProviders(() => useDailyEmotionReminder(), {
      store: storeWith({ emotionDailyPrompt: true }),
    });
    await waitFor(() => expect(scheduled).toHaveBeenCalledTimes(1));

    // Gone while the app was in the background — a restore, or the user
    // clearing the app's data.
    reminderIsGone();
    await act(async () => {
      listeners.forEach((listener) => listener("active"));
    });

    await waitFor(() => expect(scheduled).toHaveBeenCalledTimes(2));
  });

  it("tells the user when the switch is on but the OS will deliver nothing", async () => {
    permission.mockResolvedValue(false);

    const { store } = await renderHookWithProviders(
      () => useDailyEmotionReminder(),
      { store: storeWith({ emotionDailyPrompt: true }) },
    );

    await waitFor(() => expect(store.getState().info.snacks).toHaveLength(1));
    expect(store.getState().info.snacks[0].title).toContain("engedélyezd");
  });
});
