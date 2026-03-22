import { addDays, endOfWeek, startOfWeek } from "date-fns";

export const DATE_FORMAT_DISPLAY_HEADER = "MMMM do";
export const DATE_FORMAT_DISPLAY_CARD = "MMM dd";
export const DATE_FORMAT_FULL = "MMMM do, yyyy";

export const getMonday = (date: Date): Date => {
  return startOfWeek(date, { weekStartsOn: 1 });
};

export const getSaturday = (date: Date): Date => {
  return endOfWeek(date, { weekStartsOn: 1 });
};

/** True if both dates fall on the same calendar day (local timezone). */
export const isSameCalendarDay = (a: Date | number, b: Date): boolean => {
  const d = new Date(a);
  return (
    d.getFullYear() === b.getFullYear() &&
    d.getMonth() === b.getMonth() &&
    d.getDate() === b.getDate()
  );
};

type PlanWithDate = { _id: string; date: number };

/** Find plan whose date matches the given calendar day. */
export const findPlanForDate = <T extends PlanWithDate>(
  plans: T[] | undefined,
  date: Date,
): T | undefined => plans?.find((p) => isSameCalendarDay(p.date, date));

/** Clamp day index to valid week range [0..6]. */
export const clampDayIndex = (index: number): number =>
  Math.max(0, Math.min(6, index));

/** Get date for day index within week (0 = Monday). */
export const getDateInWeek = (weekMonday: Date, dayIndex: number): Date =>
  addDays(weekMonday, clampDayIndex(dayIndex));

export { differenceInCalendarDays } from "date-fns";

/** Normalize persisted value to timestamp (handles Date, number, string). */
export const toWeekStartTimestamp = (value: unknown): number => {
  if (typeof value === "number") return value;
  const d = value instanceof Date ? value : new Date(value as string);
  return d.getTime();
};

/** Normalize persisted date (may be Date, number, or string) to Date. */
export const toDate = (value: unknown, fallback: Date): Date => {
  if (value instanceof Date) return value;
  if (typeof value === "number" || typeof value === "string")
    return new Date(value);
  return fallback;
};
