import {
  allPhases,
  endOf,
  formatRemaining,
  LONG_BREAK_MS,
  phaseAt,
  SHORT_BREAK_MS,
  upcomingPhases,
  WORK_MS,
} from "@/lib/focus/pomodoro";

const T0 = 1_000_000;
const MIN = 60 * 1000;

describe("phaseAt", () => {
  it("starts with a 25-minute work block of the first round", () => {
    expect(phaseAt(T0, 4, T0)).toEqual({
      kind: "work", index: 0, round: 1, startsAt: T0, endsAt: T0 + 25 * MIN,
    });
  });

  it("switches to a 5-minute break exactly at the end of the work block", () => {
    expect(phaseAt(T0, 4, T0 + 25 * MIN - 1)?.kind).toBe("work");
    expect(phaseAt(T0, 4, T0 + 25 * MIN)).toMatchObject({ kind: "shortBreak", round: 1, endsAt: T0 + 30 * MIN });
    expect(phaseAt(T0, 4, T0 + 30 * MIN)).toMatchObject({ kind: "work", round: 2 });
  });

  it("gives a 15-minute break after the fourth work block when more rounds follow", () => {
    const longStart = T0 + 4 * WORK_MS + 3 * SHORT_BREAK_MS;
    expect(phaseAt(T0, 5, longStart)).toMatchObject({ kind: "longBreak", round: 4, endsAt: longStart + 15 * MIN });
    expect(phaseAt(T0, 5, longStart + LONG_BREAK_MS)).toMatchObject({ kind: "work", round: 5 });
  });

  it("is over after the last round's work block — no trailing break", () => {
    expect(allPhases(T0, 2).map((p) => p.kind)).toEqual(["work", "shortBreak", "work"]);
    expect(endOf(T0, 2)).toBe(T0 + 55 * MIN);
    expect(phaseAt(T0, 2, T0 + 55 * MIN - 1)?.kind).toBe("work");
    expect(phaseAt(T0, 2, T0 + 55 * MIN)).toBeNull();
    expect(endOf(T0, 1)).toBe(T0 + WORK_MS);
  });
});

describe("upcomingPhases", () => {
  it("lists the phases that haven't started yet, back to back", () => {
    const phases = upcomingPhases(T0, 4, T0 + 10 * MIN);
    expect(phases.map((p) => p.kind)).toEqual([
      "shortBreak", "work", "shortBreak", "work", "shortBreak", "work",
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
