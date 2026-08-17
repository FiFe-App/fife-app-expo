/**
 * Format a date for display in the chat UI
 * @param date - The date to format
 * @param format - The format type ('time' for HH:MM, 'short' for Mon DD)
 * @returns Formatted date string
 */
export function formatChatDate(
  date: Date | string,
  format: "time" | "short" = "time"
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (format === "time") {
    return dateObj.toLocaleTimeString("hu-HU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } else {
    return dateObj.toLocaleDateString("hu-HU", {
      month: "short",
      day: "numeric",
    });
  }
}

/** Midnight on the day the given date falls on, in the device's timezone. */
function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Whole calendar days between two dates, ignoring the time of day. */
function calendarDaysBetween(a: Date, b: Date): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / MS_PER_DAY);
}

/** True when both dates fall on the same calendar day in the device's timezone. */
export function isSameCalendarDay(a: Date | string, b: Date | string): boolean {
  const dateA = typeof a === "string" ? new Date(a) : a;
  const dateB = typeof b === "string" ? new Date(b) : b;
  return calendarDaysBetween(dateA, dateB) === 0;
}

/**
 * Label for the centered separator shown above the first message of each day,
 * e.g. "Ma 14:32", "Tegnap 9:05", "március 14. 18:22", "2024. március 14. 8:00".
 * The year is only spelled out when it differs from the current one.
 */
export function formatDateSeparator(date: Date | string, now: Date = new Date()): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const time = formatChatDate(dateObj, "time");
  const days = calendarDaysBetween(now, dateObj);

  if (days === 0) return `Ma ${time}`;
  if (days === 1) return `Tegnap ${time}`;

  const day = dateObj.toLocaleDateString("hu-HU", {
    ...(dateObj.getFullYear() === now.getFullYear() ? {} : { year: "numeric" }),
    month: "long",
    day: "numeric",
  });
  return `${day} ${time}`;
}
