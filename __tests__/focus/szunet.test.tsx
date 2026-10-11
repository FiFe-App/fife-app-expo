import { act, fireEvent, screen } from "@testing-library/react-native";
import { AppState, type AppStateStatus } from "react-native";
import { usePreventRemove } from "@react-navigation/native";

import BreakScreen from "@/app/szunet";
import {
  cancelBreakEndNotification,
  scheduleBreakEndNotification,
} from "@/lib/notifications/scheduleFocusNotifications";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

const mockBeep = jest.fn();
jest.mock("@/hooks/useBeep", () => ({ useBeep: () => mockBeep }));
jest.mock("expo-router", () => require("@/test-utils/mocks/expo-router"));
jest.mock("@react-navigation/native", () => ({ usePreventRemove: jest.fn() }));
jest.mock("@/lib/notifications/registerForPushNotifications", () => ({
  ensureNotificationPermission: jest.fn().mockResolvedValue(true),
}));
jest.mock("@/lib/notifications/scheduleFocusNotifications", () => ({
  scheduleBreakEndNotification: jest.fn().mockResolvedValue(true),
  cancelBreakEndNotification: jest.fn().mockResolvedValue(undefined),
}));

const preventRemove = usePreventRemove as jest.Mock;

let appStateListener: ((s: AppStateStatus) => void) | undefined;
beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  appStateListener = undefined;
  jest.spyOn(AppState, "addEventListener").mockImplementation((_type, listener) => {
    appStateListener = listener as (s: AppStateStatus) => void;
    return { remove: jest.fn() };
  });
});
afterEach(() => jest.useRealTimers());

const lastPreventRemove = () => preventRemove.mock.calls.at(-1)?.[0];

it("offers 15, 30 and 60 minutes and explains itself", async () => {
  await renderWithProviders(<BreakScreen />);
  expect(screen.getByText("15 perc")).toBeTruthy();
  expect(screen.getByText("30 perc")).toBeTruthy();
  expect(screen.getByText("60 perc")).toBeTruthy();
  expect(lastPreventRemove()).toBe(false);

  await fireEvent.press(screen.getByLabelText("Hogyan működik?"));
  expect(screen.getByText("Hogyan működik a Szünet?")).toBeTruthy();
});

it("locks the user in until the time is up, then beeps", async () => {
  await renderWithProviders(<BreakScreen />);
  const before = Date.now();
  await fireEvent.press(screen.getByText("15 perc"));

  expect(screen.getByText("15:00")).toBeTruthy();
  expect(screen.queryByText("30 perc")).toBeNull();
  expect(lastPreventRemove()).toBe(true);
  expect((scheduleBreakEndNotification as jest.Mock).mock.calls[0][0]).toBeGreaterThanOrEqual(before + 15 * 60 * 1000);
  expect(mockBeep).not.toHaveBeenCalled();

  await act(async () => {
    jest.advanceTimersByTime(15 * 60 * 1000);
  });
  expect(screen.getByText("00:00")).toBeTruthy();
  expect(screen.getByText("Kész")).toBeTruthy();
  expect(lastPreventRemove()).toBe(false);
  expect(mockBeep).toHaveBeenCalledTimes(1);
});

it("ends the break, silently, when the user switches apps", async () => {
  await renderWithProviders(<BreakScreen />);
  await fireEvent.press(screen.getByText("30 perc"));
  expect(screen.getByText("30:00")).toBeTruthy();

  await act(async () => appStateListener?.("inactive"));
  expect(screen.getByText("30:00")).toBeTruthy();

  await act(async () => appStateListener?.("background"));
  expect(screen.getByText("15 perc")).toBeTruthy();
  expect(lastPreventRemove()).toBe(false);
  expect(cancelBreakEndNotification).toHaveBeenCalled();
  expect(mockBeep).not.toHaveBeenCalled();
});
