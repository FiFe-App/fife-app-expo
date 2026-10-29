import { act, fireEvent, screen } from "@testing-library/react-native";
import { AppState, type AppStateStatus } from "react-native";
import { usePreventRemove } from "expo-router";

import { useKeepAwake } from "expo-keep-awake";

import BreakScreen from "@/app/szunet";
import { BREATH_IN_TEXT } from "@/components/focus/BreathingCue";
import {
  cancelBreakEndNotification,
  scheduleBreakEndNotification,
} from "@/lib/notifications/scheduleFocusNotifications";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

// The cue is hidden from screen readers on purpose (it would speak every few
// seconds), so the queries have to look at hidden elements too.
const HIDDEN = { includeHiddenElements: true };

const mockBeep = jest.fn();
jest.mock("expo-keep-awake", () => ({ useKeepAwake: jest.fn() }));
// Purely visual, and its endless animation would render thousands of frames
// while the tests fast-forward through whole breaks.
jest.mock("@/components/focus/BreathingHalo", () => ({
  ...jest.requireActual("@/components/focus/BreathingHalo"),
  __esModule: true,
  default: () => null,
}));
jest.mock("@/hooks/useBeep", () => ({ useBeep: () => mockBeep }));
jest.mock("expo-router", () => ({
  ...jest.requireActual("@/test-utils/mocks/expo-router"),
  usePreventRemove: jest.fn(),
}));
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
  expect(screen.getByText("Mennyi időre állsz meg?")).toBeTruthy();
  expect(useKeepAwake).not.toHaveBeenCalled();

  await fireEvent.press(screen.getByLabelText("Hogyan működik?"));
  expect(screen.getByText("Hogyan működik a Szünet?")).toBeTruthy();
});

it("locks the user in until the time is up, then beeps", async () => {
  await renderWithProviders(<BreakScreen />);
  const before = Date.now();
  await fireEvent.press(screen.getByText("15 perc"));

  expect(screen.getByText("15:00")).toBeTruthy();
  expect(screen.getByText(BREATH_IN_TEXT, HIDDEN)).toBeTruthy();
  expect(useKeepAwake).toHaveBeenCalled();
  expect(screen.queryByText("30 perc")).toBeNull();
  expect(lastPreventRemove()).toBe(true);
  expect((scheduleBreakEndNotification as jest.Mock).mock.calls[0][0]).toBeGreaterThanOrEqual(before + 15 * 60 * 1000);
  expect(mockBeep).not.toHaveBeenCalled();

  await act(async () => {
    jest.advanceTimersByTime(15 * 60 * 1000);
  });
  expect(screen.getByText("00:00")).toBeTruthy();
  expect(screen.getByText("Kész")).toBeTruthy();
  expect(screen.getByText("Jól esett?")).toBeTruthy();
  expect(screen.queryByText(BREATH_IN_TEXT, HIDDEN)).toBeNull();
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
