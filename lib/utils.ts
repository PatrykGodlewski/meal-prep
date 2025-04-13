import { clsx, type ClassValue } from "clsx";
import { Day, endOfWeek, format, startOfWeek } from "date-fns";
import { twMerge } from "tailwind-merge";
import { isPlainObject, camelCase } from "lodash";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatedStartOfWeek(date: Date) {
  return format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");
}

export function formatedEndOfWeek(date: Date) {
  return format(endOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");
}

function convertKeysToCamelCase<T extends Record<string, unknown>>(
  record: T,
): T {
  if (isPlainObject(record)) {
    const newRecord: Record<string, unknown> = {};

    for (const key in record) {
      if (key in record) {
        const newKey = camelCase(key);
        newRecord[newKey] = record[key];
      }
    }

    return newRecord as T;
  }

  return record;
}

export default convertKeysToCamelCase;
