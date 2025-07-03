import { endOfWeek, startOfWeek } from "date-fns";

export const DATE_FORMAT_DISPLAY_HEADER = "MMMM do";
export const DATE_FORMAT_DISPLAY_CARD = "MMM dd";
export const DATE_FORMAT_FULL = "MMMM do, yyyy";

export const getMonday = (date: Date): Date => {
  return startOfWeek(date, { weekStartsOn: 1 });
};

export const getSaturday = (date: Date): Date => {
  return endOfWeek(date, { weekStartsOn: 1 });
};
