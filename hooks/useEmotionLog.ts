import { decryptEmotionLog, encryptEmotionLog } from "@/lib/crypto/emotionLogEncryption";
import { supabase } from "@/lib/supabase/supabase";
import { mergeFromServer, markSynced, upsertLog } from "@/redux/reducers/emotionLogsReducer";
import { RootState } from "@/redux/store";
import { EmotionLogLocal } from "@/redux/store.type";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  EMOTION_MAX_TIME_FOR_YESTERDAY,
  EMOTION_MIN_TIME_FOR_TODAY,
} from "@/constants/emotionTiming";

type LegacyRow = { id: string; log_date: string; rate: number; note: string | null };

async function backfillLegacyRows(uid: string, rows: LegacyRow[]) {
  for (const row of rows) {
    try {
      const { data, nonce } = await encryptEmotionLog(uid, {
        rate: row.rate,
        note: row.note ?? undefined,
      });
      await supabase
        .from("emotion_logs")
        .update({ encrypted_data: data, nonce, rate: null, note: null })
        .eq("id", row.id);
    } catch {
      // leave as legacy plaintext; will retry on next loadFromServer call
    }
  }
}

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
  const logs = useSelector((state: RootState) => state.emotionLogs.logs);

  const cardTarget = getCardTarget(new Date());
  const alreadyLogged = logs.some((l) => l.log_date === cardTarget.targetDate);

  const saveLog = useCallback(
    async (rate: number, note?: string) => {
      if (!uid) return;
      dispatch(upsertLog({ log_date: cardTarget.targetDate, rate, note }));
      try {
        const { data, nonce } = await encryptEmotionLog(uid, { rate, note });
        await supabase
          .from("emotion_logs")
          .upsert(
            {
              author: uid,
              encrypted_data: data,
              nonce,
              rate: null,
              note: null,
              log_date: cardTarget.targetDate,
            },
            { onConflict: "author,log_date" }
          );
        dispatch(markSynced(cardTarget.targetDate));
      } catch {
        // stays synced: false — will retry on next syncPendingLogs call
      }
    },
    [uid, cardTarget.targetDate, dispatch]
  );

  const updateLog = useCallback(
    async (log_date: string, rate: number, note?: string) => {
      if (!uid) return;
      dispatch(upsertLog({ log_date, rate, note }));
      try {
        const { data, nonce } = await encryptEmotionLog(uid, { rate, note });
        await supabase
          .from("emotion_logs")
          .upsert(
            { author: uid, encrypted_data: data, nonce, rate: null, note: null, log_date },
            { onConflict: "author,log_date" }
          );
        dispatch(markSynced(log_date));
      } catch {
        // stays synced: false
      }
    },
    [uid, dispatch]
  );

  const syncPendingLogs = useCallback(async () => {
    if (!uid) return;
    const pending = logs.filter((l) => !l.synced);
    for (const log of pending) {
      try {
        const { data, nonce } = await encryptEmotionLog(uid, { rate: log.rate, note: log.note });
        await supabase
          .from("emotion_logs")
          .upsert(
            {
              author: uid,
              encrypted_data: data,
              nonce,
              rate: null,
              note: null,
              log_date: log.log_date,
            },
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
      .select("id, encrypted_data, nonce, rate, note, log_date, created_at")
      .eq("author", uid)
      .order("log_date", { ascending: false });
    if (!data) return;

    const mapped: EmotionLogLocal[] = [];
    const legacyRows: LegacyRow[] = [];

    for (const row of data) {
      if (row.encrypted_data && row.nonce) {
        const plain = await decryptEmotionLog(uid, { data: row.encrypted_data, nonce: row.nonce });
        if (plain) {
          mapped.push({
            log_date: row.log_date,
            rate: plain.rate,
            note: plain.note,
            synced: true,
            created_at: row.created_at,
            updated_at: row.created_at,
          });
        }
        // else: decryption failed (corrupt/tampered/wrong key) — skip, don't crash
      } else if (row.rate != null) {
        mapped.push({
          log_date: row.log_date,
          rate: row.rate,
          note: row.note ?? undefined,
          synced: true,
          created_at: row.created_at,
          updated_at: row.created_at,
        });
        legacyRows.push({ id: row.id, log_date: row.log_date, rate: row.rate, note: row.note });
      }
    }

    dispatch(mergeFromServer(mapped));

    if (legacyRows.length > 0) {
      backfillLegacyRows(uid, legacyRows);
    }
  }, [uid, dispatch]);

  return {
    // Not gated on emotion_daily_prompt: that preference controls the
    // 20:00 push reminder only. The in-app card is not a notification,
    // needs no OS permission, and stays available to everyone.
    shouldShowCard: cardTarget.shouldShow && !alreadyLogged,
    isYesterday: cardTarget.isYesterday,
    targetDate: cardTarget.targetDate,
    logs,
    saveLog,
    updateLog,
    syncPendingLogs,
    loadFromServer,
  };
}
