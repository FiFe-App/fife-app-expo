import { Platform } from "react-native";

export const EMOTION_MAX_TIME_FOR_YESTERDAY = 13;
export const EMOTION_MIN_TIME_FOR_TODAY = 14;
export const EMOTION_MAX_TIME_FOR_TODAY = 3;

/** Set to true to restrict emotion logging to native (iOS/Android) only. */
export const EMOTION_LOG_NATIVE_ONLY = true;

/** Use this instead of Platform.OS checks throughout emotion-log code. */
export const emotionAvailable = !EMOTION_LOG_NATIVE_ONLY || Platform.OS !== "web";
