const MINUTE = 60 * 1000;

export const WORK_MS = 25 * MINUTE;
export const SHORT_BREAK_MS = 5 * MINUTE;
export const LONG_BREAK_MS = 15 * MINUTE;
/** A long break comes after every this many work blocks. */
export const WORKS_PER_CYCLE = 4;

export const MIN_ROUNDS = 1;
export const MAX_ROUNDS = 8;
export const DEFAULT_ROUNDS = 4;

export type PhaseKind = "work" | "shortBreak" | "longBreak";

export interface Phase {
  kind: PhaseKind;
  /** 0-based position of this phase since the timer was started. */
  index: number;
  /** 1-based round this phase belongs to (a work block and the break after it). */
  round: number;
  startsAt: number;
  endsAt: number;
}

export function phaseDuration(kind: PhaseKind): number {
  return kind === "work" ? WORK_MS : kind === "shortBreak" ? SHORT_BREAK_MS : LONG_BREAK_MS;
}

/** Even phases are work; the break after every fourth work block is long. */
function kindOf(index: number): PhaseKind {
  if (index % 2 === 0) return "work";
  return ((index + 1) / 2) % WORKS_PER_CYCLE === 0 ? "longBreak" : "shortBreak";
}

/** A round is a work block plus the break after it — except the last, which ends on work. */
const phaseCount = (rounds: number) => 2 * rounds - 1;

/**
 * Every phase of a timer started at `startedAt` for `rounds` rounds. Derived
 * from nothing but those two, so the screen can be closed, the app
 * backgrounded or restarted, and it still lands on the same phase the
 * scheduled notifications assume.
 */
export function allPhases(startedAt: number, rounds: number): Phase[] {
  const phases: Phase[] = [];
  let t = startedAt;
  for (let index = 0; index < phaseCount(rounds); index++) {
    const kind = kindOf(index);
    const ms = phaseDuration(kind);
    phases.push({ kind, index, round: Math.floor(index / 2) + 1, startsAt: t, endsAt: t + ms });
    t += ms;
  }
  return phases;
}

/** When the last work block ends. */
export function endOf(startedAt: number, rounds: number): number {
  return allPhases(startedAt, rounds).at(-1)!.endsAt;
}

/** The phase running at `now`, or null once all rounds are done. */
export function phaseAt(startedAt: number, rounds: number, now: number): Phase | null {
  return allPhases(startedAt, rounds).find((p) => now < p.endsAt) ?? null;
}

/** The phases that haven't started yet at `now`. */
export function upcomingPhases(startedAt: number, rounds: number, now: number): Phase[] {
  return allPhases(startedAt, rounds).filter((p) => p.startsAt > now);
}

export function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
