const MINUTE = 60 * 1000;

export const WORK_MS = 25 * MINUTE;
export const SHORT_BREAK_MS = 5 * MINUTE;
export const LONG_BREAK_MS = 15 * MINUTE;
/** A long break comes after every this many work blocks. */
export const WORKS_PER_CYCLE = 4;

export type PhaseKind = "work" | "shortBreak" | "longBreak";

export interface Phase {
  kind: PhaseKind;
  /** 0-based position of this phase since the timer was started. */
  index: number;
  startsAt: number;
  endsAt: number;
}

/** Work, break, work, break, … with the last break of a cycle being long. */
const CYCLE: { kind: PhaseKind; ms: number }[] = Array.from(
  { length: WORKS_PER_CYCLE },
  (_, i) => [
    { kind: "work" as const, ms: WORK_MS },
    i === WORKS_PER_CYCLE - 1
      ? { kind: "longBreak" as const, ms: LONG_BREAK_MS }
      : { kind: "shortBreak" as const, ms: SHORT_BREAK_MS },
  ],
).flat();
const CYCLE_MS = CYCLE.reduce((sum, p) => sum + p.ms, 0);

/**
 * The phase running at `now`, derived from nothing but the start time — so the
 * screen can be closed, the app backgrounded or restarted, and it still lands
 * on the same phase the scheduled notifications assume.
 */
export function phaseAt(startedAt: number, now: number): Phase {
  const elapsed = Math.max(0, now - startedAt);
  const cycles = Math.floor(elapsed / CYCLE_MS);
  let t = startedAt + cycles * CYCLE_MS;
  let index = cycles * CYCLE.length;
  for (const p of CYCLE) {
    if (now < t + p.ms) return { kind: p.kind, index, startsAt: t, endsAt: t + p.ms };
    t += p.ms;
    index++;
  }
  // Only reachable on floating-point edge cases: the next cycle's first phase.
  return { kind: CYCLE[0].kind, index, startsAt: t, endsAt: t + CYCLE[0].ms };
}

/** The next `count` phases after the one running at `now`. */
export function upcomingPhases(startedAt: number, now: number, count: number): Phase[] {
  const phases: Phase[] = [];
  let p = phaseAt(startedAt, now);
  for (let i = 0; i < count; i++) {
    p = phaseAt(startedAt, p.endsAt);
    phases.push(p);
  }
  return phases;
}

export function phaseDuration(kind: PhaseKind): number {
  return kind === "work" ? WORK_MS : kind === "shortBreak" ? SHORT_BREAK_MS : LONG_BREAK_MS;
}

export function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
