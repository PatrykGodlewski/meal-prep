import { mealCategoryEnum, unitEnum } from "@/supabase/schema";
import { z } from "zod";

export const mealCategories = z.enum(mealCategoryEnum.enumValues);
export const unitTypes = z.enum(unitEnum.enumValues);

export type MealCategory = z.infer<typeof mealCategories>;
export type UnitType = z.infer<typeof unitTypes>;
