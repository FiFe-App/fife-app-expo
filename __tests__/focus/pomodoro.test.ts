import {
  formatRemaining,
  LONG_BREAK_MS,
  phaseAt,
  SHORT_BREAK_MS,
  upcomingPhases,
  WORK_MS,
} from "@/lib/focus/pomodoro";

const T0 = 1_000_000;
const MIN = 60 * 1000;
const CYCLE = 4 * WORK_MS + 3 * SHORT_BREAK_MS + LONG_BREAK_MS;

describe("phaseAt", () => {
  it("starts with a 25-minute work block", () => {
    expect(phaseAt(T0, T0)).toEqual({ kind: "work", index: 0, startsAt: T0, endsAt: T0 + 25 * MIN });
  });

  it("switches to a 5-minute break exactly at the end of the work block", () => {
    expect(phaseAt(T0, T0 + 25 * MIN - 1).kind).toBe("work");
    expect(phaseAt(T0, T0 + 25 * MIN)).toMatchObject({ kind: "shortBreak", index: 1, endsAt: T0 + 30 * MIN });
    expect(phaseAt(T0, T0 + 30 * MIN)).toMatchObject({ kind: "work", index: 2 });
  });

  it("gives a 15-minute break after the fourth work block", () => {
    const longStart = T0 + 4 * WORK_MS + 3 * SHORT_BREAK_MS;
    expect(phaseAt(T0, longStart)).toMatchObject({ kind: "longBreak", index: 7, endsAt: longStart + 15 * MIN });
  });

  it("repeats the cycle indefinitely", () => {
    expect(phaseAt(T0, T0 + CYCLE)).toMatchObject({ kind: "work", index: 8, startsAt: T0 + CYCLE });
    expect(phaseAt(T0, T0 + 3 * CYCLE + 26 * MIN)).toMatchObject({ kind: "shortBreak", index: 25 });
  });
});

describe("upcomingPhases", () => {
  it("lists the phases after the current one, in order", () => {
    const phases = upcomingPhases(T0, T0 + 10 * MIN, 8);
    expect(phases.map((p) => p.index)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(phases.map((p) => p.kind)).toEqual([
      "shortBreak", "work", "shortBreak", "work", "shortBreak", "work", "longBreak", "work",
    ]);
    phases.slice(1).forEach((p, i) => expect(p.startsAt).toBe(phases[i].endsAt));
  });
});

describe("formatRemaining", () => {
  it("rounds up to whole seconds and never goes negative", () => {
    expect(formatRemaining(25 * MIN)).toBe("25:00");
    expect(formatRemaining(61_500)).toBe("01:02");
    expect(formatRemaining(-5)).toBe("00:00");
  });
});
