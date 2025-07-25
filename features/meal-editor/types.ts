import type { FunctionReturnType } from "convex/server";
import type { api } from "@/convex/_generated/api";

export type Meal = NonNullable<
  FunctionReturnType<typeof api.meals.queries.getMeal>
>;
export type MealIngredients = Meal["mealIngredients"];
