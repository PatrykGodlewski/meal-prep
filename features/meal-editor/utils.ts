import type { FunctionReturnType } from "convex/server";
import type { api } from "@/convex/_generated/api";
import type { MealUpdateFormValues } from "./schema";

// Type for the data structure returned by api.meals.getMeal
type MealGetData = FunctionReturnType<typeof api.meals.getMeal>;

/**
 * Maps the fetched MealDetails data structure to the structure
 * required by the MealUpdateFormValues (Zod schema type).
 */
export const mapMealDataToFormValues = (
  meal: MealGetData,
): MealUpdateFormValues | undefined => {
  if (!meal) return undefined;

  const { mealIngredients, ...mealData } = meal;

  const formIngredients = (mealIngredients || [])
    .filter((mi) => mi.ingredient !== null) // Ensure ingredient data exists
    .map((mi) => {
      const ingredient = mi.ingredient!; // Safe due to filter
      return {
        id: ingredient._id, // Ingredient definition ID
        name: ingredient.name,
        category: ingredient.category ?? "other", // Provide default
        unit: ingredient.unit ?? "g", // Provide default
        quantity: mi.quantity,
        isOptional: mi.isOptional ?? false,
        notes: mi.notes ?? "",
      };
    });

  return {
    id: mealData._id,
    name: mealData.name,
    description: mealData.description ?? "", // Ensure string
    prepTimeMinutes: mealData.prepTimeMinutes ?? undefined, // Map null to undefined for form
    cookTimeMinutes: mealData.cookTimeMinutes ?? undefined,
    servings: mealData.servings ?? undefined,
    category: mealData.category ?? "lunch", // Provide default
    imageUrl: mealData.imageUrl ?? "", // Ensure string
    instructions: mealData.instructions ?? "", // Ensure string
    isPublic: mealData.isPublic ?? false,
    ingredients: formIngredients,
  };
};
