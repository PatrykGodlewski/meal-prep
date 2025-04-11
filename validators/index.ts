import {
  INGREDIENT_CATEGORY_ENUM,
  MEAL_CATEGORY_ENUM,
  UNIT_ENUM,
} from "@/supabase/schema";
import { z } from "zod";

export const mealCategories = z.enum(MEAL_CATEGORY_ENUM.enumValues);
export const unitTypes = z.enum(UNIT_ENUM.enumValues);
export const ingredientCategories = z.enum(INGREDIENT_CATEGORY_ENUM.enumValues);

export type MealCategory = z.infer<typeof mealCategories>;
export type UnitType = z.infer<typeof unitTypes>;
export type IngredientCategory = z.infer<typeof ingredientCategories>;
