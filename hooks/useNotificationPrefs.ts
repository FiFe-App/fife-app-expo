import { useCallback } from "react";
import { Platform } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { TablesUpdate } from "@/database.types";
import { supabase } from "@/lib/supabase/supabase";
import {
  ensureNotificationPermission,
  registerForPushNotificationsAsync,
} from "@/lib/notifications/registerForPushNotifications";
import {
  cancelDailyEmotionReminder,
  scheduleDailyEmotionReminder,
} from "@/lib/notifications/scheduleDailyEmotionReminder";
import { showDialog } from "@/redux/reducers/infoReducer";
import { patchNotificationPrefs, setNotificationPrefs } from "@/redux/reducers/userReducer";
import { RootState } from "@/redux/store";
import { NotificationPrefs } from "@/redux/store.type";

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  notifyPush: false,
  notifyEmail: true,
  newsletter: false,
  emotionDailyPrompt: false,
  pushAskedAt: null,
  emotionPromptAskedAt: null,
  newsletterAskedAt: null,
};

/** Preferences the user is asked about by a prompt card on /me. */
export type AskablePref = "notifyPush" | "emotionDailyPrompt" | "newsletter";
export type TogglePref = AskablePref | "notifyEmail";

/** Preferences whose delivery depends on the OS notification grant. */
const NEEDS_PERMISSION: Record<TogglePref, boolean> = {
  notifyPush: true,
  emotionDailyPrompt: true,
  notifyEmail: false,
  newsletter: false,
};

const prefColumn = (key: TogglePref, value: boolean): TablesUpdate<"profiles"> => {
  switch (key) {
    case "notifyPush":
      return { notify_push: value };
    case "notifyEmail":
      return { notify_email: value };
    case "newsletter":
      return { newsletter: value };
    case "emotionDailyPrompt":
      return { emotion_daily_prompt: value };
  }
};

const askedColumn = (key: AskablePref, at: string): TablesUpdate<"profiles"> => {
  switch (key) {
    case "notifyPush":
      return { push_asked_at: at };
    case "emotionDailyPrompt":
      return { emotion_prompt_asked_at: at };
    case "newsletter":
      return { newsletter_asked_at: at };
  }
};

const askedField = (key: AskablePref, at: string): Partial<NotificationPrefs> => {
  switch (key) {
    case "notifyPush":
      return { pushAskedAt: at };
    case "emotionDailyPrompt":
      return { emotionPromptAskedAt: at };
    case "newsletter":
      return { newsletterAskedAt: at };
  }
};

const isAskable = (key: TogglePref): key is AskablePref => key !== "notifyEmail";

/**
 * Reads the notification preferences from Redux (hydrated from
 * get_my_notification_prefs on login) and writes them back to
 * `profiles`, running the side effects each preference implies:
 * requesting the OS permission, registering the push token and
 * scheduling or cancelling the daily emotion reminder.
 *
 * This is the single place those side effects live — screens should
 * never call registerForPushNotificationsAsync or the reminder
 * scheduler directly.
 */
export function useNotificationPrefs() {
  const dispatch = useDispatch();
  const uid = useSelector((state: RootState) => state.user.uid);
  const stored = useSelector((state: RootState) => state.user.notificationPrefs);
  const prefs = stored ?? DEFAULT_NOTIFICATION_PREFS;
  /**
   * False until the prefs have been read back from the server. Callers
   * that decide whether to *ask* the user something must wait for this —
   * the defaults claim nothing has been asked yet, which would flash a
   * prompt at someone who answered it long ago.
   */
  const hydrated = stored !== undefined;

  /** Fetch from the server and hydrate Redux. Returns the fresh prefs. */
  const reload = useCallback(async (): Promise<NotificationPrefs | null> => {
    if (!uid) return null;
    const { data, error } = await supabase.rpc("get_my_notification_prefs");
    const row = data?.[0];
    if (error || !row) return null;
    const fresh: NotificationPrefs = {
      notifyPush: row.notify_push ?? false,
      notifyEmail: row.notify_email ?? true,
      newsletter: row.newsletter ?? false,
      emotionDailyPrompt: row.emotion_daily_prompt ?? false,
      pushAskedAt: row.push_asked_at ?? null,
      emotionPromptAskedAt: row.emotion_prompt_asked_at ?? null,
      newsletterAskedAt: row.newsletter_asked_at ?? null,
    };
    dispatch(setNotificationPrefs(fresh));
    return fresh;
  }, [uid, dispatch]);

  /**
   * Record that we've put a question to the user without changing the
   * preference — i.e. they dismissed the card. Stops it coming back.
   */
  const markAsked = useCallback(
    async (key: AskablePref) => {
      if (!uid) return;
      const now = new Date().toISOString();
      dispatch(patchNotificationPrefs(askedField(key, now)));
      await supabase.from("profiles").update(askedColumn(key, now)).eq("id", uid);
    },
    [uid, dispatch],
  );

  /**
   * Set one preference. Returns the value actually stored — enabling a
   * push-backed preference falls back to false if the user denies the
   * OS permission.
   */
  const setPref = useCallback(
    async (key: TogglePref, value: boolean): Promise<boolean> => {
      if (!uid) return prefs[key];
      let stored = value;

      if (value && NEEDS_PERMISSION[key] && Platform.OS !== "web") {
        const granted = await ensureNotificationPermission();
        if (!granted) {
          stored = false;
          dispatch(
            showDialog({
              title: "Az értesítések le vannak tiltva",
              text: "Engedélyezd az értesítéseket a telefonod beállításaiban, hogy értesíthessünk.",
              submitText: "Rendben",
              onSubmit: () => {},
            }),
          );
        }
      }

      // Setting a preference explicitly answers its prompt, so stamp the
      // "asked" column in the same write — otherwise a user who turns the
      // newsletter on in the settings screen would still be asked for it
      // by a card on /me.
      const now = new Date().toISOString();
      const askable = isAskable(key);

      dispatch(
        patchNotificationPrefs({
          [key]: stored,
          ...(askable ? askedField(key, now) : {}),
        }),
      );
      await supabase
        .from("profiles")
        .update({
          ...prefColumn(key, stored),
          ...(askable ? askedColumn(key, now) : {}),
        })
        .eq("id", uid);

      if (key === "notifyPush" && stored) {
        const token = await registerForPushNotificationsAsync();
        if (token) await supabase.rpc("update_my_push_token", { token });
      }
      if (key === "emotionDailyPrompt") {
        if (stored) await scheduleDailyEmotionReminder();
        else await cancelDailyEmotionReminder();
      }

      return stored;
    },
    [uid, prefs, dispatch],
  );

  return { prefs, hydrated, setPref, markAsked, reload };
}
