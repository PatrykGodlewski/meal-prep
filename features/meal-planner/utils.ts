/**
 * @fileoverview Utility functions for Meal Planner feature.
 * Includes constants, date helpers, data parsing, and structure manipulation.
 */

import { format, startOfWeek, addDays, isValid } from "date-fns";
import type { MealPlanClient } from "./types";
import type { Meal } from "@/supabase/schema";

// --- Constants ---

/** Names of the days, indexed according to date-fns getDay() (Sunday=0). */
/** Standard date format for internal keys and database lookups. */
export const DATE_FORMAT_KEY = "yyyy-MM-dd";
/** Date format for displaying the week header. */
export const DATE_FORMAT_DISPLAY_HEADER = "MMMM do";
/** Date format for displaying dates within day cards. */
export const DATE_FORMAT_DISPLAY_CARD = "MMM dd";
/** Base query key for React Query meal plan data. */
export const MEAL_PLAN_QUERY_KEY_BASE = "mealPlanWeek";

export const SHOPPING_LIST_QUERY_KEY_BASE = "shoppingList";

// --- Date Helpers ---

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

/**
 * Sorts an array of MealPlanDayInternal objects from Monday to Sunday based on the date.
 * @param weekData - An array of parsed meal plan days (order not guaranteed).
 * @returns A new array sorted from Monday to Sunday.
 */
export const sortWeekDataMonToSun = (
  weekData: MealPlanClient[],
): MealPlanClient[] => {
  return [...weekData].sort((a, b) => {
    // Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const dayA = a.date.getDay();
    const dayB = b.date.getDay();

    // Adjust index for sorting (Mon=1, ..., Sun=7)
    const sortA = dayA === 0 ? 7 : dayA; // Sunday is 0, make it 7
    const sortB = dayB === 0 ? 7 : dayB;

    return sortA - sortB;
  });
};

/**
 * Creates a complete 7-day structure (Monday to Sunday) for a given week start date,
 * with empty meal arrays.
 * @param startDate - Any date within the desired week.
 * @returns A sorted array of 7 MealPlanDayInternal objects representing the full week.
 */
export const createBaseWeekStructure = (startDate: Date): MealPlanClient[] => {
  const mondayStart = getMonday(startDate); // Ensure we start from Monday
  const weekDays = Array.from({ length: 7 }).map((_, i): MealPlanClient => {
    const currentDate = addDays(mondayStart, i);
    return {
      date: currentDate,
      meals: [] as Meal[],
    };
  });
  // The generated structure is already Mon-Sun because we start from Monday and add days
  return weekDays;
};

/**
 * Merges successfully parsed meal plan data onto a base 7-day structure.
 * @param baseStructure - The complete 7-day structure (Mon-Sun), typically from `createBaseWeekStructure`.
 * @param parsedData - An array of successfully parsed MealPlanDayInternal objects (order not guaranteed).
 * @returns A new 7-day array (Mon-Sun) where days from `parsedData` replace corresponding days in `baseStructure`.
 */
export const mergeDataWithBaseStructure = (
  baseStructure: MealPlanClient[],
  parsedData: MealPlanClient[] | null | undefined,
): MealPlanClient[] => {
  // If no valid parsed data, return the base structure as is
  if (!parsedData || parsedData.length === 0) {
    return baseStructure;
  }

  // Create a map of the parsed data using a consistent date key for efficient lookup
  const dataMap = new Map<string, MealPlanClient>();
  for (const day of parsedData) {
    if (isValid(day.date)) {
      dataMap.set(format(day.date, DATE_FORMAT_KEY), day);
    }
  }
  // Iterate over the base structure (which defines the final order and completeness)
  // Replace with data from the map if a match is found for the date key
  return baseStructure.map(
    (baseDay) => dataMap.get(format(baseDay.date, DATE_FORMAT_KEY)) ?? baseDay, // Use fetched data or default to base day
  );
};
