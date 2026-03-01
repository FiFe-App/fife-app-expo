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
