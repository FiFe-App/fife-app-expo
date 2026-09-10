import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useDispatch, useSelector } from "react-redux";

import { emotionAvailable } from "@/constants/emotionTiming";
import {
  cancelDailyEmotionReminder,
  syncDailyEmotionReminder,
} from "@/lib/notifications/scheduleDailyEmotionReminder";
import { addSnack } from "@/redux/reducers/infoReducer";
import { RootState } from "@/redux/store";

/**
 * Keeps the device's evening reminder matching the stored preference.
 *
 * The reminder is a local schedule, and the OS loses it on its own: an app
 * update, a restore onto a new phone, "clear data", a permission revoked and
 * granted again. It used to be armed only while handling a login, so once it
 * was gone it stayed gone for as long as the user remained signed in — which,
 * with a session that refreshes itself, is indefinitely.
 *
 * So it is re-checked whenever the app comes to the foreground, and whenever
 * the preference itself changes. The check is one read of the schedule; a
 * write only happens when the reminder is genuinely missing.
 *
 * Signing out cancels it: the next person to pick up the phone should not be
 * asked how *they* are on behalf of an account that is no longer here.
 */
export function useDailyEmotionReminder() {
  const dispatch = useDispatch();
  const uid = useSelector((state: RootState) => state.user.uid);
  const prefs = useSelector((state: RootState) => state.user.notificationPrefs);
  // `undefined` means the preferences have not been read back from the server
  // yet. Acting on the defaults would cancel a perfectly good reminder on
  // every start, before the real answer arrives.
  const hydrated = prefs !== undefined;
  const enabled = !!prefs?.emotionDailyPrompt;
  const warnedAboutPermission = useRef(false);

  const sync = useCallback(async () => {
    if (!emotionAvailable) return;

    if (!uid) {
      await cancelDailyEmotionReminder();
      return;
    }
    if (!hydrated) return;

    const status = await syncDailyEmotionReminder(enabled);

    // The switch says the reminder is on and the OS will deliver nothing.
    // Said once per app run, because it is the user who has to fix it.
    if (status === "no-permission" && !warnedAboutPermission.current) {
      warnedAboutPermission.current = true;
      dispatch(
        addSnack({
          title:
            "Az esti kérdés nem tud megérkezni: engedélyezd az értesítéseket a telefonod beállításaiban.",
        }),
      );
    }
  }, [uid, hydrated, enabled, dispatch]);

  useEffect(() => {
    sync();
  }, [sync]);

  useEffect(() => {
    if (!emotionAvailable) return;
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") sync();
    });
    return () => subscription.remove();
  }, [sync]);
}
