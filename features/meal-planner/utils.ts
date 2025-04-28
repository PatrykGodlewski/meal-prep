import { startOfWeek, isValid, endOfWeek } from "date-fns";

export const DATE_FORMAT_KEY = "yyyy-MM-dd";
export const DATE_FORMAT_DISPLAY_HEADER = "MMMM do";
export const DATE_FORMAT_DISPLAY_CARD = "MMM dd";

export const getMonday = (date?: Date): Date => {
  const validDate = isValid(date) ? date : new Date();
  return startOfWeek(validDate!, { weekStartsOn: 1 });
};

export const getSaturday = (date?: Date): Date => {
  const validDate = isValid(date) ? date : new Date();
  return endOfWeek(validDate!, { weekStartsOn: 1 });
};
