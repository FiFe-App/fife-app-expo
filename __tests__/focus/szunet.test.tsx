import { act, fireEvent, screen } from "@testing-library/react-native";
import { AppState, type AppStateStatus } from "react-native";
import { router } from "expo-router";

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
jest.mock("expo-router", () => require("@/test-utils/mocks/expo-router"));
jest.mock("@/lib/notifications/registerForPushNotifications", () => ({
  ensureNotificationPermission: jest.fn().mockResolvedValue(true),
}));
jest.mock("@/lib/notifications/scheduleFocusNotifications", () => ({
  scheduleBreakEndNotification: jest.fn().mockResolvedValue(true),
  cancelBreakEndNotification: jest.fn().mockResolvedValue(undefined),
}));

const { __setPathname } = jest.requireMock("expo-router");

let appStateListener: ((s: AppStateStatus) => void) | undefined;
beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  __setPathname("/szunet");
  appStateListener = undefined;
  jest.spyOn(AppState, "addEventListener").mockImplementation((_type, listener) => {
    appStateListener = listener as (s: AppStateStatus) => void;
    return { remove: jest.fn() };
  });
});
afterEach(() => jest.useRealTimers());

it("says what is about to happen and offers 15, 30 and 60 minutes", async () => {
  await renderWithProviders(<BreakScreen />);
  expect(screen.getByText(/amikor nő, lélegezz be, amikor csökken, fújd ki/)).toBeTruthy();
  expect(screen.getByText("15 perc")).toBeTruthy();
  expect(screen.getByText("30 perc")).toBeTruthy();
  expect(screen.getByText("60 perc")).toBeTruthy();
  expect(screen.getByText("Mennyi időre állsz meg?")).toBeTruthy();
  expect(useKeepAwake).not.toHaveBeenCalled();

  await fireEvent.press(screen.getByLabelText("Hogyan működik?"));
  expect(screen.getByText("Hogyan működik a Szünet?")).toBeTruthy();
});

it("counts down in whole minutes, drops the cue after a minute, then beeps", async () => {
  const { store } = await renderWithProviders(<BreakScreen />);
  const before = Date.now();
  await fireEvent.press(screen.getByText("15 perc"));

  expect(screen.getByText("15 perc")).toBeTruthy();
  expect(screen.getByText("van hátra")).toBeTruthy();
  expect(screen.queryByText("30 perc")).toBeNull();
  expect(screen.getByText(BREATH_IN_TEXT, HIDDEN)).toBeTruthy();
  expect(useKeepAwake).toHaveBeenCalled();
  expect((scheduleBreakEndNotification as jest.Mock).mock.calls[0][0]).toBeGreaterThanOrEqual(before + 15 * 60 * 1000);
  // The status bar and gesture area take the break's blue too.
  expect(store.getState().info.screenTint).toEqual({ path: "/szunet", color: "#eaf5fb" });

  await act(async () => {
    jest.advanceTimersByTime(60 * 1000);
  });
  expect(screen.getByText("14 perc")).toBeTruthy();
  expect(screen.queryByText(BREATH_IN_TEXT, HIDDEN)).toBeNull();
  expect(screen.queryByText("és ki…", HIDDEN)).toBeNull();
  expect(mockBeep).not.toHaveBeenCalled();

  await act(async () => {
    jest.advanceTimersByTime(14 * 60 * 1000);
  });
  expect(screen.getByText("Letelt")).toBeTruthy();
  expect(screen.getByText("Jól esett?")).toBeTruthy();
  expect(mockBeep).toHaveBeenCalledTimes(1);

  await fireEvent.press(screen.getByText("Kész"));
  expect(router.back).toHaveBeenCalled();
});

it("can be ended any time with Kész vagyok", async () => {
  await renderWithProviders(<BreakScreen />);
  await fireEvent.press(screen.getByText("30 perc"));
  await fireEvent.press(screen.getByText("Kész vagyok"));
  expect(cancelBreakEndNotification).toHaveBeenCalled();
  expect(router.back).toHaveBeenCalled();
  expect(mockBeep).not.toHaveBeenCalled();
});

it("ends the break, silently, when the user switches apps", async () => {
  await renderWithProviders(<BreakScreen />);
  await fireEvent.press(screen.getByText("30 perc"));
  expect(screen.getByText("van hátra")).toBeTruthy();

  await act(async () => appStateListener?.("inactive"));
  expect(screen.getByText("van hátra")).toBeTruthy();

  await act(async () => appStateListener?.("background"));
  expect(screen.getByText("Mennyi időre állsz meg?")).toBeTruthy();
  expect(cancelBreakEndNotification).toHaveBeenCalled();
  expect(mockBeep).not.toHaveBeenCalled();
});

it("gives the colour of the bars back when it is left", async () => {
  const { store, unmount } = await renderWithProviders(<BreakScreen />);
  expect(store.getState().info.screenTint?.path).toBe("/szunet");
  await act(async () => unmount());
  expect(store.getState().info.screenTint).toBeNull();
});
