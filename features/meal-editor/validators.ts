import { ingredientCategories, mealCategories, unitTypes } from "@/validators";
import { z } from "zod";

export const IngredientFormSchema = z.object({
  id: z.string().uuid().optional(), // ID of selected existing ingredient
  name: z.string().min(1, "Ingredient name is required"),
  category: ingredientCategories, // Use Zod enum from validator
  unit: unitTypes, // Use Zod enum from validator
  quantity: z.number().min(1, "Quantity is required"),
  isOptional: z.boolean().default(false),
  notes: z.string().nullable().optional(),
});

export const MealAddFormSchema = z.object({
  // Renamed for clarity
  name: z.string().min(2, "Meal name must be at least 2 characters."),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters."),
  instructions: z.string().nullable().optional(),
  prepTimeMinutes: z.coerce.number().int().positive().nullable().optional(),
  cookTimeMinutes: z.coerce.number().int().positive().nullable().optional(),
  servings: z.coerce.number().int().positive().nullable().optional(),
  category: mealCategories, // Use Zod enum from validator
  imageUrl: z
    .string()
    .url("Invalid URL")
    .or(z.literal(""))
    .nullable()
    .optional(),
  isPublic: z.boolean().default(false), // Corrected typo from 'ublic'
  ingredients: z
    .array(IngredientFormSchema)
    .min(1, "At least one ingredient is required."),
});

export type MealAddFormValues = z.infer<typeof MealAddFormSchema>;
export type IngredientFormState = z.infer<typeof IngredientFormSchema>;
