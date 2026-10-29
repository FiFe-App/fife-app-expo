import { act, fireEvent, screen } from "@testing-library/react-native";

import FocusScreen from "@/app/focus";
import { scheduleFocusNotifications } from "@/lib/notifications/scheduleFocusNotifications";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

const mockBeep = jest.fn();
jest.mock("@/hooks/useBeep", () => ({ useBeep: () => mockBeep }));
jest.mock("@/lib/notifications/registerForPushNotifications", () => ({
  ensureNotificationPermission: jest.fn().mockResolvedValue(true),
}));
jest.mock("@/lib/notifications/scheduleFocusNotifications", () => ({
  scheduleFocusNotifications: jest.fn().mockResolvedValue(true),
  cancelFocusNotifications: jest.fn().mockResolvedValue(undefined),
}));

const MIN = 60 * 1000;

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
});
afterEach(() => jest.useRealTimers());

it("lets the user pick between 1 and 8 rounds", async () => {
  const { store } = await renderWithProviders(<FocusScreen />);
  expect(screen.getByText("4 kör")).toBeTruthy();

  for (let i = 0; i < 10; i++) await fireEvent.press(screen.getByLabelText("Több kör"));
  expect(screen.getByText("8 kör")).toBeTruthy();
  for (let i = 0; i < 10; i++) await fireEvent.press(screen.getByLabelText("Kevesebb kör"));
  expect(screen.getByText("1 kör")).toBeTruthy();
  expect(store.getState().focus.rounds).toBe(1);
});

it("runs the chosen rounds, beeping at each change, then finishes", async () => {
  const { store } = await renderWithProviders(<FocusScreen />);
  await fireEvent.press(screen.getByLabelText("Kevesebb kör"));
  await fireEvent.press(screen.getByLabelText("Kevesebb kör"));
  expect(screen.getByText("2 kör")).toBeTruthy();

  await fireEvent.press(screen.getByText("Indítás"));
  const startedAt = store.getState().focus.startedAt!;
  expect(scheduleFocusNotifications).toHaveBeenCalledWith(startedAt, 2);
  expect(screen.getByText("25:00")).toBeTruthy();
  expect(screen.getByText("1/2. kör")).toBeTruthy();
  expect(screen.queryByText("2 kör")).toBeNull();

  await act(async () => {
    jest.advanceTimersByTime(25 * MIN);
  });
  expect(screen.getByText("Szünet · 1/2")).toBeTruthy();
  expect(mockBeep).toHaveBeenCalledTimes(1);

  await act(async () => {
    jest.advanceTimersByTime(5 * MIN);
  });
  expect(screen.getByText("2/2. kör")).toBeTruthy();

  await act(async () => {
    jest.advanceTimersByTime(25 * MIN);
  });
  expect(screen.getByText("Ügyes voltál!")).toBeTruthy();
  expect(mockBeep).toHaveBeenCalledTimes(3);

  await fireEvent.press(screen.getByText("Kész"));
  expect(store.getState().focus.startedAt).toBeNull();
  expect(screen.getByText("2 kör")).toBeTruthy();
});
