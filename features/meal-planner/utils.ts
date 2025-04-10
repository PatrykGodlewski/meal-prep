/**
 * @fileoverview Utility functions for Meal Planner feature.
 * Includes constants, date helpers, data parsing, and structure manipulation.
 */

import { format, startOfWeek, addDays, isValid, getDay } from "date-fns";
import {
  MealPlanDayInternalSchema,
  type MealPlanDayInternal,
  type WeeklyPlanClientInput,
  type MealPlanDayClientInput,
  MealClient, // Import the single day input type
} from "@/validators/mealPlanner"; // Adjust path
import { dayEnum } from "@/supabase/schema";

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

// --- Data Processing ---

/**
 * Parses a single day's client data using Zod, returning the internal format or null on failure.
 * @param dayClientData - The raw data object for a single day.
 * @returns The parsed data in internal format (with Date object) or null if parsing fails.
 */
const parseDayData = (
  dayClientData: MealPlanDayClientInput | null | undefined,
): MealPlanDayInternal | null => {
  if (!dayClientData) return null;

  const result = MealPlanDayInternalSchema.safeParse(dayClientData);
  if (result.success) {
    return result.data;
  } else {
    console.warn(
      "Zod parsing failed for a day:",
      result.error.flatten().fieldErrors,
      "Input:",
      dayClientData,
    );
    return null;
  }
};

/**
 * Parses an array of raw client week data, filtering out invalid days.
 * @param clientData - The raw array potentially containing null/undefined or invalid day objects.
 * @returns An array containing only the successfully parsed and validated MealPlanDayInternal objects.
 */
export const parseValidDaysFromWeekData = (
  clientData: WeeklyPlanClientInput | null | undefined,
): MealPlanDayInternal[] => {
  if (!clientData || !Array.isArray(clientData)) return [];

  // Use map and filter: parse each day, then filter out the nulls (failed parses)
  return clientData
    .map(parseDayData) // Attempt to parse each day
    .filter((day): day is MealPlanDayInternal => day !== null); // Keep only non-null (successful) results
};

/**
 * Sorts an array of MealPlanDayInternal objects from Monday to Sunday.
 * @param weekData - An array of parsed meal plan days (order not guaranteed).
 * @returns A new array sorted from Monday to Sunday.
 */
export const sortWeekDataMonToSun = (
  weekData: MealPlanDayInternal[],
): MealPlanDayInternal[] => {
  // Create map for efficient day ordering lookup
  const dayOrderMap = new Map(
    dayEnum.enumValues.map((name, index) => [name, index === 0 ? 7 : index]),
  ); // Sun=7, Mon=1...

  // Sort using the map, handling potential unknown day names gracefully
  return [...weekData].sort((a, b) => {
    // Use spread operator for immutability
    const sortA = dayOrderMap.get(a.dayName) ?? 8; // Default to end if name is somehow invalid
    const sortB = dayOrderMap.get(b.dayName) ?? 8;
    return sortA - sortB;
  });
};

/**
 * Creates a complete 7-day structure (Monday to Sunday) for a given week start date,
 * with empty meal arrays.
 * @param startDate - Any date within the desired week.
 * @returns A sorted array of 7 MealPlanDayInternal objects representing the full week.
 */
export const createBaseWeekStructure = (
  startDate: Date,
): MealPlanDayInternal[] => {
  const mondayStart = getMonday(startDate); // Ensure we start from Monday
  const weekDays = Array.from({ length: 7 }).map(
    (_, i): MealPlanDayInternal => {
      const currentDate = addDays(mondayStart, i);
      return {
        dateString: format(currentDate, DATE_FORMAT_KEY),
        date: currentDate,
        dayName: dayEnum.enumValues[getDay(currentDate)],
        meals: [] as MealClient[],
      };
    },
  );
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
  baseStructure: MealPlanDayInternal[],
  parsedData: MealPlanDayInternal[] | null | undefined,
): MealPlanDayInternal[] => {
  // If no valid parsed data, return the base structure as is
  if (!parsedData || parsedData.length === 0) {
    return baseStructure;
  }

  // Create a map of the parsed data using a consistent date key for efficient lookup
  const dataMap = new Map<string, MealPlanDayInternal>();
  parsedData.forEach((day) => {
    if (isValid(day.date)) {
      // Ensure date is valid before using it as a key
      dataMap.set(format(day.date, DATE_FORMAT_KEY), day);
    }
  });

  // Iterate over the base structure (which defines the final order and completeness)
  // Replace with data from the map if a match is found for the date key
  return baseStructure.map(
    (baseDay) => dataMap.get(format(baseDay.date, DATE_FORMAT_KEY)) ?? baseDay, // Use fetched data or default to base day
  );
};
