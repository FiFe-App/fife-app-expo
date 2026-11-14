export const FOCUS_PREFIX = "focus-";
export const BREAK_END_ID = "break-end";

/**
 * Whether a notification belongs to the Fókusz/Szünet timers. While the app is
 * open those screens beep on their own, so the notification stays silent.
 */
export const isTimerNotification = (identifier: string) =>
  identifier.startsWith(FOCUS_PREFIX) || identifier === BREAK_END_ID;
