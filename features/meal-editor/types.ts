import type { api } from "@/convex/_generated/api";
import type { FunctionReturnType } from "convex/server";

export type Meal = NonNullable<FunctionReturnType<typeof api.meals.getMeal>>;
export type MealIngredients = Meal["mealIngredients"];
