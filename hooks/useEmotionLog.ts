import { supabase } from "@/lib/supabase/supabase";
import { RootState } from "@/redux/store";
import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  EMOTION_MAX_TIME_FOR_YESTERDAY,
  EMOTION_MIN_TIME_FOR_TODAY,
} from "@/constants/emotionTiming";

export type EmotionLog = {
  id: string;
  rate: number;
  log_date: string;
  created_at: string;
};

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getCardTarget(now: Date) {
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
  const { uid } = useSelector((state: RootState) => state.user);
  const emotionCheckEnabled = useSelector(
    (state: RootState) => state.user.notificationPrefs?.emotionCheckEnabled ?? true
  );

  const cardTarget = getCardTarget(new Date());
  const [alreadyLogged, setAlreadyLogged] = useState<boolean | null>(null);
  const [allLogs, setAllLogs] = useState<EmotionLog[]>([]);

  const checkTodayLog = useCallback(async () => {
    if (!uid || !cardTarget.shouldShow || !emotionCheckEnabled) {
      setAlreadyLogged(true);
      return;
    }
    const { data } = await supabase
      .from("emotion_logs")
      .select("id")
      .eq("author", uid)
      .eq("log_date", cardTarget.targetDate)
      .maybeSingle();
    setAlreadyLogged(!!data);
  }, [uid, cardTarget.targetDate, cardTarget.shouldShow, emotionCheckEnabled]);

  const saveLog = async (rate: number): Promise<{ error: string | null }> => {
    if (!uid) return { error: null };
    const { error } = await supabase.from("emotion_logs").upsert(
      { author: uid, rate, log_date: cardTarget.targetDate },
      { onConflict: "author,log_date" }
    );
    if (error) return { error: error.message };
    setAlreadyLogged(true);
    return { error: null };
  };

  const fetchAllLogs = useCallback(async () => {
    if (!uid) return;
    const { data } = await supabase
      .from("emotion_logs")
      .select("id, rate, log_date, created_at")
      .eq("author", uid)
      .order("log_date", { ascending: false });
    if (data) setAllLogs(data as EmotionLog[]);
  }, [uid]);

  useEffect(() => {
    checkTodayLog();
  }, [checkTodayLog]);

  return {
    shouldShowCard: cardTarget.shouldShow && alreadyLogged === false && emotionCheckEnabled,
    isYesterday: cardTarget.isYesterday,
    saveLog,
    allLogs,
    fetchAllLogs,
  };
}
