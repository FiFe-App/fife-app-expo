import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";

import { authenticateOwner } from "@/lib/appLock";

/**
 * How long Én may be out of sight before it locks again. Short trips away — a
 * permission dialog, the share sheet, copying a code from another app, a quick
 * look at Mi — should not make the user unlock every time.
 */
export const LOCK_AFTER_MS = 30_000;

/**
 * The app-zár. It guards Én mód — the private side with the journal — and
 * nothing else: someone who opens the app in public just to chat or search
 * (Mi mód) never meets the lock, and nobody looking over their shoulder gets
 * to Én without it.
 *
 * `active` is whether the lock applies at all (switched on, signed in,
 * native); `inEn` is whether the route on screen belongs to Én.
 *
 * - A cold start with the lock on begins locked, but the lock only shows once
 *   Én is about to be on screen.
 * - Én counts as "out of sight" while the app is in the background and while
 *   the user is on the Mi side. Coming back to Én after `LOCK_AFTER_MS` of
 *   that locks it again.
 * - Switching the setting on mid-session does not lock straight away;
 *   switching it off unlocks.
 */
export function useAppLock(active: boolean, inEn: boolean) {
  const enabled = active && Platform.OS !== "web";
  // Read once: a cold start with the lock on begins locked, so nothing private
  // shows before the user has unlocked.
  const [locked, setLocked] = useState(enabled);
  // Since when Én has not been in front of the user; null while it is.
  const awaySince = useRef<number | null>(null);
  const backgrounded = useRef(false);
  const inEnRef = useRef(inEn);
  inEnRef.current = inEn;
  const prompting = useRef(false);

  const awayTooLong = () =>
    awaySince.current !== null && Date.now() - awaySince.current >= LOCK_AFTER_MS;

  // Moving between the two sides.
  useEffect(() => {
    if (!enabled) {
      awaySince.current = null;
      return;
    }
    if (!inEn) {
      if (awaySince.current === null) awaySince.current = Date.now();
      return;
    }
    // Back on Én. If the app is still in the background the 'active' event
    // below does the checking when the user actually returns.
    if (backgrounded.current) return;
    if (awayTooLong()) setLocked(true);
    awaySince.current = null;
  }, [enabled, inEn]);

  useEffect(() => {
    if (!enabled) return;
    const sub = AppState.addEventListener("change", (state) => {
      // Only "background" counts: iOS reports "inactive" while its own Face ID
      // prompt is up, and that must not start the clock.
      if (state === "background") {
        backgrounded.current = true;
        // Stamped here, not in an effect: a backgrounded app may not get to
        // render before the user is back, and the clock would start too late.
        if (awaySince.current === null) awaySince.current = Date.now();
      } else if (state === "active") {
        backgrounded.current = false;
        if (inEnRef.current) {
          if (awayTooLong()) setLocked(true);
          awaySince.current = null;
        }
      }
    });
    return () => sub.remove();
  }, [enabled]);

  const unlock = useCallback(async () => {
    if (prompting.current) return false;
    prompting.current = true;
    try {
      const ok = await authenticateOwner("FiFe App feloldása");
      if (ok) setLocked(false);
      return ok;
    } finally {
      prompting.current = false;
    }
  }, []);

  // Judged while rendering as well, not only in the effect above, so the very
  // first frame of Én after a long time away is already covered.
  const dueOnReturn = enabled && inEn && !backgrounded.current && awayTooLong();
  return { locked: enabled && inEn && (locked || dueOnReturn), unlock };
}
