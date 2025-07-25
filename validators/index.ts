import { z } from "zod";
import { INGREDIENT_CATEGORIES, MEAL_CATEGORIES, UNITS } from "@/convex/schema";

export const mealCategories = z.enum(MEAL_CATEGORIES);
export const unitTypes = z.enum(UNITS);
export const ingredientCategories = z.enum(INGREDIENT_CATEGORIES);

export type MealCategory = z.infer<typeof mealCategories>;
export type UnitType = z.infer<typeof unitTypes>;
export type IngredientCategory = z.infer<typeof ingredientCategories>;
