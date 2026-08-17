import { decryptSettings, encryptSettings } from "@/lib/crypto/settingsEncryption";
import { supabase } from "@/lib/supabase/supabase";
import { setHomeAddBuzinessCardDismissed } from "@/redux/reducers/appReducer";
import { hydrateSettings, markSettingsSynced } from "@/redux/reducers/userReducer";
import { RootState } from "@/redux/store";
import { UserSettingsPayload } from "@/redux/store.type";
import { DEFAULT_THEME_PREFERENCE } from "@/assets/theme";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

/** How long to wait after the last local change before pushing to the server. */
const PUSH_DEBOUNCE_MS = 1000;

const DEFAULT_NOTIFICATION_PREFS = {
  notifyPush: false,
  notifyEmail: false,
  newsletter: false,
  emotionDailyPrompt: true,
};

function toNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is number => typeof v === "number");
}

/**
 * Key-order-independent serialisation, used to tell "the server already has
 * this" from "this is a real local change". Going through a single helper means
 * a reordered field can't make hydration look like an edit and bounce a
 * redundant write back at the server.
 */
function serialize(settings: UserSettingsPayload): string {
  return JSON.stringify(settings, (_key, value) => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>)
          .filter(([, v]) => v !== undefined)
          .sort(([a], [b]) => a.localeCompare(b)),
      );
    }
    return value;
  });
}

/**
 * Keeps the local preference state in sync with the user's public.user_settings
 * row, so preferences survive a reinstall and follow the user across devices.
 *
 * Redux stays the read path for the UI — nothing here blocks rendering, and
 * every network failure degrades to "keep using the local values". Conflicts
 * resolve last-write-wins at row granularity: two devices editing the Lusta
 * Lista while both offline will keep whichever pushed last, not a merge.
 */
export function useUserSettings() {
  const dispatch = useDispatch();

  const uid = useSelector((state: RootState) => state.user.uid);
  const mantra = useSelector((state: RootState) => state.user.mantra);
  const tasks = useSelector((state: RootState) => state.user.tasks);
  const previousSearches = useSelector((state: RootState) => state.user.previousSearches);
  const themePreference = useSelector((state: RootState) => state.user.themePreference);
  const savedBuzinesses = useSelector((state: RootState) => state.user.savedBuzinesses);
  const isItSafeDismissed = useSelector((state: RootState) => state.user.isItSafeDismissed);
  const inviteCardDismissed = useSelector((state: RootState) => state.user.inviteCardDismissed);
  const notificationPrefs = useSelector((state: RootState) => state.user.notificationPrefs);
  const homeAddBuzinessCardDismissed = useSelector(
    (state: RootState) => state.app.homeAddBuzinessCardDismissed,
  );

  const local: UserSettingsPayload = useMemo(
    () => ({
      mantra,
      tasks: tasks ?? [],
      previousSearches: previousSearches ?? [],
      themePreference: themePreference ?? DEFAULT_THEME_PREFERENCE,
      savedBuzinesses: savedBuzinesses ?? [],
      isItSafeDismissed: isItSafeDismissed ?? false,
      inviteCardDismissed: inviteCardDismissed ?? false,
      homeAddBuzinessCardDismissed: homeAddBuzinessCardDismissed ?? false,
      notificationPrefs: notificationPrefs ?? DEFAULT_NOTIFICATION_PREFS,
    }),
    [
      mantra,
      tasks,
      previousSearches,
      themePreference,
      savedBuzinesses,
      isItSafeDismissed,
      inviteCardDismissed,
      homeAddBuzinessCardDismissed,
      notificationPrefs,
    ],
  );

  // Kept in a ref so the debounced push always sends the newest state without
  // the effect having to re-subscribe on every keystroke.
  const localRef = useRef(local);
  localRef.current = local;

  /**
   * Serialised copy of whatever the server last agreed with. The auto-push
   * effect compares against this so hydrating from the server doesn't
   * immediately bounce the same values back up.
   */
  const syncedSnapshotRef = useRef<string | null>(null);
  const hasLoadedRef = useRef(false);
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pushToServer = useCallback(async () => {
    if (!uid) return;
    const settings = localRef.current;
    const snapshot = serialize(settings);
    try {
      const cipher = await encryptSettings(uid, {
        mantra: settings.mantra,
        tasks: settings.tasks,
        previousSearches: settings.previousSearches,
      });
      const { data, error } = await supabase
        .from("user_settings")
        .upsert(
          {
            author: uid,
            encrypted_data: cipher.data,
            nonce: cipher.nonce,
            theme_preference: settings.themePreference,
            saved_buzinesses: settings.savedBuzinesses,
            is_it_safe_dismissed: settings.isItSafeDismissed,
            invite_card_dismissed: settings.inviteCardDismissed,
            home_add_buziness_card_dismissed: settings.homeAddBuzinessCardDismissed,
            notify_push: settings.notificationPrefs.notifyPush,
            notify_email: settings.notificationPrefs.notifyEmail,
            newsletter: settings.notificationPrefs.newsletter,
            emotion_daily_prompt: settings.notificationPrefs.emotionDailyPrompt,
          },
          { onConflict: "author" },
        )
        .select("updated_at")
        .single();
      if (error || !data) return;
      syncedSnapshotRef.current = snapshot;
      dispatch(markSettingsSynced(data.updated_at));
    } catch {
      // Offline or key unavailable — local state is untouched and the next
      // change (or the next login) retries.
    }
  }, [uid, dispatch]);

  /**
   * Pulls the server row and lets it win. When no row exists yet, the current
   * local state is seeded upward instead — that's what carries an existing
   * user's device-local mantra and Lusta Lista into the new table the first
   * time they open a build that has it.
   */
  const loadFromServer = useCallback(async () => {
    if (!uid) return;
    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("author", uid)
      .maybeSingle();

    if (error) return; // Offline or transient — keep the local values.

    if (!data) {
      hasLoadedRef.current = true;
      await pushToServer();
      return;
    }

    const decrypted =
      data.encrypted_data && data.nonce
        ? await decryptSettings(uid, { data: data.encrypted_data, nonce: data.nonce })
        : null;

    // A missing or undecryptable blob must not wipe the user's mantra and
    // tasks — fall back to whatever this device already has.
    const current = localRef.current;
    const settings: UserSettingsPayload = {
      mantra: decrypted ? decrypted.mantra : current.mantra,
      tasks: decrypted ? decrypted.tasks : current.tasks,
      previousSearches: decrypted ? decrypted.previousSearches : current.previousSearches,
      themePreference:
        (data.theme_preference as UserSettingsPayload["themePreference"]) ??
        DEFAULT_THEME_PREFERENCE,
      savedBuzinesses: toNumberArray(data.saved_buzinesses),
      isItSafeDismissed: data.is_it_safe_dismissed,
      inviteCardDismissed: data.invite_card_dismissed,
      homeAddBuzinessCardDismissed: data.home_add_buziness_card_dismissed,
      notificationPrefs: {
        notifyPush: data.notify_push,
        notifyEmail: data.notify_email,
        newsletter: data.newsletter,
        emotionDailyPrompt: data.emotion_daily_prompt,
      },
    };

    syncedSnapshotRef.current = serialize(settings);
    hasLoadedRef.current = true;
    dispatch(hydrateSettings({ settings, syncedAt: data.updated_at }));
    dispatch(setHomeAddBuzinessCardDismissed(settings.homeAddBuzinessCardDismissed));
  }, [uid, dispatch, pushToServer]);

  // A fresh account needs its own load before anything may be pushed, otherwise
  // one user's defaults could be written over another's row.
  useEffect(() => {
    hasLoadedRef.current = false;
    syncedSnapshotRef.current = null;
  }, [uid]);

  // Debounced push, so editing the mantra doesn't fire a request per keystroke.
  useEffect(() => {
    if (!uid || !hasLoadedRef.current) return;
    if (serialize(local) === syncedSnapshotRef.current) return;

    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(() => {
      pushTimerRef.current = null;
      pushToServer();
    }, PUSH_DEBOUNCE_MS);

    return () => {
      if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
      pushTimerRef.current = null;
    };
  }, [uid, local, pushToServer]);

  return { loadFromServer, pushToServer };
}
