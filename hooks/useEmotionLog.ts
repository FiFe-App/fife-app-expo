import { supabase } from "@/lib/supabase/supabase";
import { mergeFromServer, markSynced, upsertLog } from "@/redux/reducers/emotionLogsReducer";
import { RootState } from "@/redux/store";
import { EmotionLogLocal } from "@/redux/store.type";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  EMOTION_MAX_TIME_FOR_YESTERDAY,
  EMOTION_MIN_TIME_FOR_TODAY,
  emotionAvailable,
} from "@/constants/emotionTiming";
import { scheduleDailyEmotionReminder } from "@/lib/notifications/scheduleDailyEmotionReminder";

function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getCardTarget(now: Date) {
  const hour = now.getHours() + now.getMinutes() / 60;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (hour < EMOTION_MAX_TIME_FOR_YESTERDAY) {
    return { targetDate: formatDate(yesterday), isYesterday: true, shouldShow: true };
  }
  if (hour >= EMOTION_MIN_TIME_FOR_TODAY) {
    return { targetDate: formatDate(today), isYesterday: false, shouldShow: true };
  }
  return { targetDate: formatDate(today), isYesterday: false, shouldShow: false };
}

export function useEmotionLog() {
  const dispatch = useDispatch();
  const { uid } = useSelector((state: RootState) => state.user);
  const emotionDailyPrompt = useSelector(
    (state: RootState) => state.user.notificationPrefs?.emotionDailyPrompt ?? true
  );
  const logs = useSelector((state: RootState) => state.emotionLogs.logs);

  const cardTarget = getCardTarget(new Date());
  const alreadyLogged = logs.some((l) => l.log_date === cardTarget.targetDate);

  const skipReminderIfLoggedToday = useCallback(
    (log_date: string) => {
      if (!emotionAvailable || !emotionDailyPrompt) return;
      if (log_date !== formatDate(new Date())) return;
      scheduleDailyEmotionReminder(true).catch(() => {});
    },
    [emotionDailyPrompt]
  );

  const saveLog = useCallback(
    async (rate: number, note?: string) => {
      if (!uid) return;
      dispatch(upsertLog({ log_date: cardTarget.targetDate, rate, note }));
      skipReminderIfLoggedToday(cardTarget.targetDate);
      try {
        await supabase
          .from("emotion_logs")
          .upsert(
            { author: uid, rate, note: note ?? null, log_date: cardTarget.targetDate },
            { onConflict: "author,log_date" }
          );
        dispatch(markSynced(cardTarget.targetDate));
      } catch {
        // stays synced: false — will retry on next syncPendingLogs call
      }
    },
    [uid, cardTarget.targetDate, dispatch, skipReminderIfLoggedToday]
  );

  const updateLog = useCallback(
    async (log_date: string, rate: number, note?: string) => {
      if (!uid) return;
      dispatch(upsertLog({ log_date, rate, note }));
      skipReminderIfLoggedToday(log_date);
      try {
        await supabase
          .from("emotion_logs")
          .upsert(
            { author: uid, rate, note: note ?? null, log_date },
            { onConflict: "author,log_date" }
          );
        dispatch(markSynced(log_date));
      } catch {
        // stays synced: false
      }
    },
    [uid, dispatch, skipReminderIfLoggedToday]
  );

  const syncPendingLogs = useCallback(async () => {
    if (!uid) return;
    const pending = logs.filter((l) => !l.synced);
    for (const log of pending) {
      try {
        await supabase
          .from("emotion_logs")
          .upsert(
            { author: uid, rate: log.rate, note: log.note ?? null, log_date: log.log_date },
            { onConflict: "author,log_date" }
          );
        dispatch(markSynced(log.log_date));
      } catch {
        // keep for next attempt
      }
    }
  }, [uid, logs, dispatch]);

  const loadFromServer = useCallback(async () => {
    if (!uid) return;
    const { data } = await supabase
      .from("emotion_logs")
      .select("rate, note, log_date, created_at")
      .eq("author", uid)
      .order("log_date", { ascending: false });
    if (data) {
      const mapped: EmotionLogLocal[] = data.map((row) => ({
        log_date: row.log_date,
        rate: row.rate,
        note: row.note ?? undefined,
        synced: true,
        created_at: row.created_at,
        updated_at: row.created_at,
      }));
      dispatch(mergeFromServer(mapped));
    }
  }, [uid, dispatch]);

  return {
    shouldShowCard: cardTarget.shouldShow && !alreadyLogged && emotionDailyPrompt,
    isYesterday: cardTarget.isYesterday,
    logs,
    saveLog,
    updateLog,
    syncPendingLogs,
    loadFromServer,
  };
}
