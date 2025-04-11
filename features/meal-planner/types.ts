import type { Meal } from "@/supabase/schema";

export type MealPlanClient = {
  date: Date;
  meals: Meal[];
};
