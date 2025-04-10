// src/lib/validators/mealPlannerSchemas.ts
import { z } from "zod";
import type { MealCategory } from "@/validators"; // Adjust import
import { dayEnum } from "@/supabase/schema";

// Schema for a single meal within a day plan
export const MealClientSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.custom<MealCategory>(), // Or z.enum if applicable
});

// Schema for a single day's data coming FROM the server/action
export const MealPlanDayClientSchema = z.object({
  dateString: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date string format",
  }),
  dayName: z.enum(dayEnum.enumValues),
  meals: z.array(MealClientSchema),
});

// Schema for the internal state for a single day (with Date object)
export const MealPlanDayInternalSchema = MealPlanDayClientSchema.transform(
  (data) => ({
    ...data,
    date: new Date(data.dateString), // Transform string to Date
  }),
);

// Types derived from schemas
export type MealClient = z.output<typeof MealClientSchema>;
export type MealPlanDayClientInput = z.input<typeof MealPlanDayClientSchema>;
export type MealPlanDayInternal = z.output<typeof MealPlanDayInternalSchema>;

// Type for the raw array potentially received from server action
export type WeeklyPlanClientInput = z.input<typeof MealPlanDayClientSchema>[];
