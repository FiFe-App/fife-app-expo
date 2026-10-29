import { act, screen } from "@testing-library/react-native";

import BreathingCue, { BREATH_IN_TEXT, BREATH_OUT_TEXT } from "@/components/focus/BreathingCue";
import { BREATH_IN_MS, BREATH_OUT_MS } from "@/components/focus/BreathingHalo";
import { renderWithProviders } from "@/test-utils/renderWithProviders";

// The cue is hidden from screen readers on purpose (it would speak every few
// seconds), so the queries have to look at hidden elements too.
const HIDDEN = { includeHiddenElements: true };

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

const advance = (ms: number) => act(async () => {
  jest.advanceTimersByTime(ms);
});

it("breathes in for 4 seconds and out for 6, over and over", async () => {
  await renderWithProviders(<BreathingCue color="#000" />);
  expect(BREATH_IN_MS).toBe(4000);
  expect(BREATH_OUT_MS).toBe(6000);

  expect(screen.getByText(BREATH_IN_TEXT, HIDDEN)).toBeTruthy();
  await advance(BREATH_IN_MS - 1);
  expect(screen.getByText(BREATH_IN_TEXT, HIDDEN)).toBeTruthy();
  await advance(1);
  expect(screen.getByText(BREATH_OUT_TEXT, HIDDEN)).toBeTruthy();
  await advance(BREATH_OUT_MS);
  expect(screen.getByText(BREATH_IN_TEXT, HIDDEN)).toBeTruthy();
  await advance(BREATH_IN_MS);
  expect(screen.getByText(BREATH_OUT_TEXT, HIDDEN)).toBeTruthy();
});

it("holds the first breath in while the circle opens", async () => {
  await renderWithProviders(<BreathingCue color="#000" delayMs={800} />);
  await advance(BREATH_IN_MS);
  expect(screen.getByText(BREATH_IN_TEXT, HIDDEN)).toBeTruthy();
  await advance(800);
  expect(screen.getByText(BREATH_OUT_TEXT, HIDDEN)).toBeTruthy();
});
