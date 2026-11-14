// Napló dates are local calendar days stored as "YYYY-MM-DD" strings, which
// sort the same lexicographically as chronologically.

export const toDateString = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getTodayDateString = (): string => toDateString(new Date());

// `new Date("YYYY-MM-DD")` parses as UTC midnight, which is the previous day
// west of Greenwich — build the date from its parts so it stays local.
export const parseDateString = (date: string): Date => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const formatLogDate = (date: string): string =>
  parseDateString(date).toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
