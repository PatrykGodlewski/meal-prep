import { INGREDIENT_CATEGORIES, MEAL_CATEGORIES, UNITS } from "@/convex/schema"; // Assuming schema.ts is in convex/
import { z } from "zod";

// Zod enums from Convex schema constants
const ingredientCategoryEnum = z.enum(INGREDIENT_CATEGORIES);
const mealCategoryEnum = z.enum(MEAL_CATEGORIES);
const unitEnum = z.enum(UNITS);

// Schema for a single ingredient within the form
export const IngredientFormSchema = z.object({
  // ID of the ingredient definition (if existing)
  id: z.any().optional(),
  // Name is required, used for lookup or creation
  name: z.string().min(1, "Ingredient name is required"),
  // Category and Unit are required for new ingredients, populated for existing
  category: ingredientCategoryEnum,
  unit: unitEnum,
  // Meal-specific details
  quantity: z.coerce.number().positive("Quantity must be positive"), // Use coerce for input type="number"
  calories: z.coerce.number().nonnegative("Quantity must be non-negative"), // Use coerce for input type="number"
  isOptional: z.boolean().default(false),
  notes: z.string().optional(),
});

// Base schema for common meal fields
const MealBaseSchema = z.object({
  name: z.string().min(2, "Meal name must be at least 2 characters."),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters."),
  instructions: z.string().optional(),
  prepTimeMinutes: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .or(z.literal(null).transform(() => undefined)), // Handle empty string -> undefined
  cookTimeMinutes: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .or(z.literal(null).transform(() => undefined)),
  servings: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .or(z.literal(null).transform(() => undefined)),
  calories: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .or(z.literal(null).transform(() => undefined)),
  category: mealCategoryEnum,
  imageUrl: z
    .string()
    .url("Invalid URL format")
    .or(z.literal(""))
    .optional()
    .transform((val) => (val === "" ? undefined : val)), // Treat empty string as null
  isPublic: z.boolean().default(false),
  ingredients: z
    .array(IngredientFormSchema)
    .min(1, "At least one ingredient is required.")
    .refine(
      (items) => {
        // Ensure unique ingredient names within the meal
        const names = items.map((item) => item.name.toLowerCase().trim());
        return new Set(names).size === names.length;
      },
      { message: "Ingredient names must be unique within the meal." },
    ),
});

// Schema for adding a new meal (no meal ID yet)
export const MealAddFormSchema = MealBaseSchema;

// Schema for updating an existing meal (requires meal ID)
export const MealUpdateFormSchema = MealBaseSchema.extend({
  mealId: z.string(), // Meal ID is required for updates
});

// TypeScript types inferred from schemas
export type IngredientFormValues = z.infer<typeof IngredientFormSchema>;
export type MealAddFormValues = z.infer<typeof MealAddFormSchema>;
export type MealUpdateFormValues = z.infer<typeof MealUpdateFormSchema>;
