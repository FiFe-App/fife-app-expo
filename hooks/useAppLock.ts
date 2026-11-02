import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";

import { authenticateOwner } from "@/lib/appLock";

/**
 * How long the app may sit in the background before it locks again. Short
 * trips away — a permission dialog, the share sheet, copying a code from
 * another app — should not make the user unlock every time.
 */
export const LOCK_AFTER_MS = 30_000;

/**
 * The app-zár. `active` is whether the lock applies right now (switched on,
 * signed in, native). While active, the app starts locked on a cold start and
 * locks again after `LOCK_AFTER_MS` in the background. Switching the setting
 * on mid-session does not lock straight away; switching it off unlocks.
 */
export function useAppLock(active: boolean) {
  const enabled = active && Platform.OS !== "web";
  // Read once: a cold start with the lock on begins locked, so nothing private
  // shows before the user has unlocked.
  const [locked, setLocked] = useState(enabled);
  const backgroundedAt = useRef<number | null>(null);
  const prompting = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    const sub = AppState.addEventListener("change", (state) => {
      // Only "background" counts: iOS reports "inactive" while its own Face ID
      // prompt is up, and that must not start the clock.
      if (state === "background") {
        if (backgroundedAt.current === null) backgroundedAt.current = Date.now();
      } else if (state === "active") {
        const since = backgroundedAt.current;
        backgroundedAt.current = null;
        if (since !== null && Date.now() - since >= LOCK_AFTER_MS) setLocked(true);
      }
    });
    return () => sub.remove();
  }, [enabled]);

  const unlock = useCallback(async () => {
    if (prompting.current) return false;
    prompting.current = true;
    try {
      const ok = await authenticateOwner("FiFe feloldása");
      if (ok) setLocked(false);
      return ok;
    } finally {
      prompting.current = false;
    }
  }, []);

  return { locked: enabled && locked, unlock };
}
