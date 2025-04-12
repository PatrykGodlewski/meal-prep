import { clsx, type ClassValue } from "clsx";
import { Day, format, startOfWeek } from "date-fns";
import { twMerge } from "tailwind-merge";
import { isPlainObject, camelCase } from "lodash";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
