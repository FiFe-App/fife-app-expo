import { act, fireEvent, screen } from "@testing-library/react-native";
import { AppState, type AppStateStatus } from "react-native";
import { usePreventRemove } from "@react-navigation/native";

import BreakScreen from "@/app/szunet";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

jest.mock("expo-router", () => require("@/test-utils/mocks/expo-router"));
jest.mock("@react-navigation/native", () => ({ usePreventRemove: jest.fn() }));

const preventRemove = usePreventRemove as jest.Mock;

let appStateListener: ((s: AppStateStatus) => void) | undefined;
beforeEach(() => {
  jest.useFakeTimers();
  preventRemove.mockClear();
  appStateListener = undefined;
  jest.spyOn(AppState, "addEventListener").mockImplementation((_type, listener) => {
    appStateListener = listener as (s: AppStateStatus) => void;
    return { remove: jest.fn() };
  });
});
afterEach(() => jest.useRealTimers());

const lastPreventRemove = () => preventRemove.mock.calls.at(-1)?.[0];

it("offers 15, 30 and 60 minutes", async () => {
  await renderWithProviders(<BreakScreen />);
  expect(screen.getByText("15 perc")).toBeTruthy();
  expect(screen.getByText("30 perc")).toBeTruthy();
  expect(screen.getByText("60 perc")).toBeTruthy();
  expect(lastPreventRemove()).toBe(false);
});

it("locks the user in until the time is up", async () => {
  await renderWithProviders(<BreakScreen />);
  await fireEvent.press(screen.getByText("15 perc"));

  expect(screen.getByText("15:00")).toBeTruthy();
  expect(screen.queryByText("30 perc")).toBeNull();
  expect(lastPreventRemove()).toBe(true);

  await act(async () => {
    jest.advanceTimersByTime(15 * 60 * 1000);
  });
  expect(screen.getByText("00:00")).toBeTruthy();
  expect(screen.getByText("Kész")).toBeTruthy();
  expect(lastPreventRemove()).toBe(false);
});

it("ends the break when the user switches apps", async () => {
  await renderWithProviders(<BreakScreen />);
  await fireEvent.press(screen.getByText("30 perc"));
  expect(screen.getByText("30:00")).toBeTruthy();

  await act(async () => appStateListener?.("inactive"));
  expect(screen.getByText("30:00")).toBeTruthy();

  await act(async () => appStateListener?.("background"));
  expect(screen.getByText("15 perc")).toBeTruthy();
  expect(lastPreventRemove()).toBe(false);
});
