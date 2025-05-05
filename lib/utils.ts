import { type ClassValue, clsx } from "clsx";
import { endOfWeek, format, startOfWeek } from "date-fns";
import { redirect } from "next/navigation";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatedStartOfWeek(date: Date) {
  return format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");
}

export function formatedEndOfWeek(date: Date) {
  return format(endOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");
}

export function encodedRedirect(
  type: "error" | "success",
  path: string,
  message: string,
) {
  return redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}
