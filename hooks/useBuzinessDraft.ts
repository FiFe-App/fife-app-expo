import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  BuzinessDraft,
  clearBuzinessDraft,
  setBuzinessDraft,
} from "@/redux/reducers/appReducer";
import { RootState } from "@/redux/store";

/**
 * Keeps what is typed into the biznisz editor.
 *
 * A half-written biznisz used to live only in the screen's own state, so
 * anything that took the app down took it with it — and on Android that is
 * routine: switch to the camera or a browser for long enough and the OS
 * reclaims the app, which comes back as a cold start with an empty form.
 *
 * The draft is keyed by what is being edited (the row's id, or "new"), so an
 * unfinished new biznisz and an unsaved change to an existing one cannot
 * overwrite each other.
 */

/** What the user typed, without the bookkeeping the store adds. */
export type BuzinessDraftValues = Omit<BuzinessDraft, "savedAt">;

/**
 * Writes are debounced: redux-persist puts the whole store on disk after every
 * action, which is not something to do on each keystroke.
 */
const WRITE_DELAY_MS = 600;

/** Is there anything in here worth offering back to the user? */
export const isDraftWorthKeeping = (values: BuzinessDraftValues): boolean =>
  !!values.title.trim() ||
  !!values.description.trim() ||
  values.categories.length > 0 ||
  values.ingyen ||
  values.isPublic ||
  !!values.circle ||
  values.defaultContact != null;

/**
 * Are these the same values? Used to tell an unsaved change from a draft that
 * merely repeats what the server already has — the second kind is not worth
 * telling the user about, and offering it back would cry wolf on every visit.
 */
export const draftMatches = (
  a: BuzinessDraftValues,
  b: BuzinessDraftValues,
): boolean =>
  a.title.trim() === b.title.trim() &&
  a.description.trim() === b.description.trim() &&
  a.categories.join("\u0000") === b.categories.join("\u0000") &&
  a.ingyen === b.ingyen &&
  a.isPublic === b.isPublic &&
  (a.defaultContact ?? null) === (b.defaultContact ?? null) &&
  sameCircle(a.circle, b.circle);

const sameCircle = (
  a: BuzinessDraftValues["circle"],
  b: BuzinessDraftValues["circle"],
): boolean => {
  if (!a || !b) return !a && !b;
  // Coordinates come back from PostGIS with more precision than the map ever
  // shows, so they are compared at roughly a metre.
  const near = (x: number, y: number) => Math.abs(x - y) < 0.00001;
  return (
    near(a.location.latitude, b.location.latitude) &&
    near(a.location.longitude, b.location.longitude) &&
    Math.abs((a.radius ?? 0) - (b.radius ?? 0)) < 0.5
  );
};

export const draftKeyFor = (editId?: number) =>
  editId === undefined || editId === null ? "new" : String(editId);

export function useBuzinessDraft(editId?: number) {
  const dispatch = useDispatch();
  const key = draftKeyFor(editId);
  const stored = useSelector(
    (state: RootState) => state.app.buzinessDrafts?.[key],
  );

  // Read once, as the screen opens. Reading it live would hand the editor its
  // own writes back and fight whatever the user is typing.
  const [pendingDraft] = useState<BuzinessDraft | undefined>(() => stored);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef<BuzinessDraftValues | null>(null);

  const flush = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    const values = latest.current;
    latest.current = null;
    if (!values) return;
    if (!isDraftWorthKeeping(values)) {
      dispatch(clearBuzinessDraft(key));
      return;
    }
    dispatch(
      setBuzinessDraft({
        key,
        draft: { ...values, savedAt: new Date().toISOString() },
      }),
    );
  }, [dispatch, key]);

  const saveDraft = useCallback(
    (values: BuzinessDraftValues) => {
      latest.current = values;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, WRITE_DELAY_MS);
    },
    [flush],
  );

  const clearDraft = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    latest.current = null;
    dispatch(clearBuzinessDraft(key));
  }, [dispatch, key]);

  // Leaving the screen is the moment the draft matters most, and it is also
  // when the pending write would otherwise be thrown away.
  useEffect(() => flush, [flush]);

  return { pendingDraft, saveDraft, clearDraft };
}
