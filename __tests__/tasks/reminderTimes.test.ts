import { reminderTimeFor } from "@/lib/notifications/scheduleTaskReminder";

// 2026-10-29 is a Thursday.
const thursdayNoon = new Date(2026, 9, 29, 12, 0, 0);

describe("reminderTimeFor", () => {
  it("is an hour from now", () => {
    expect(reminderTimeFor("hour", thursdayNoon).getTime()).toBe(
      thursdayNoon.getTime() + 60 * 60 * 1000,
    );
  });

  it("is this evening, or tomorrow's once evening has passed", () => {
    expect(reminderTimeFor("evening", thursdayNoon)).toEqual(new Date(2026, 9, 29, 19, 0));
    expect(reminderTimeFor("evening", new Date(2026, 9, 29, 21, 0))).toEqual(
      new Date(2026, 9, 30, 19, 0),
    );
  });

  it("is tomorrow morning", () => {
    expect(reminderTimeFor("tomorrow", thursdayNoon)).toEqual(new Date(2026, 9, 30, 9, 0));
  });

  it("is the coming Saturday morning, never in the past", () => {
    expect(reminderTimeFor("weekend", thursdayNoon)).toEqual(new Date(2026, 9, 31, 9, 0));
    const saturdayNoon = new Date(2026, 9, 31, 12, 0);
    expect(reminderTimeFor("weekend", saturdayNoon)).toEqual(new Date(2026, 10, 7, 9, 0));
  });
});
