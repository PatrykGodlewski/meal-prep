import { startOfWeek, isValid } from "date-fns";

export const DATE_FORMAT_KEY = "yyyy-MM-dd";
export const DATE_FORMAT_DISPLAY_HEADER = "MMMM do";
export const DATE_FORMAT_DISPLAY_CARD = "MMM dd";
/**
 * Calculates the start of the week (Monday) for a given date.
 * Defaults to the current week's Monday if the input date is invalid.
 * @param date - The date to find the week start for.
 * @returns The Date object representing the Monday of that week.
 */
export const getMonday = (date: Date): Date => {
  // Default to today if input is invalid, ensuring function always returns a valid Date
  const validDate = isValid(date) ? date : new Date();
  return startOfWeek(validDate, { weekStartsOn: 1 });
};
