import { z } from "zod";

/** Caloric and macro targets for the diet. */
export const dietTargetsSchema = z.object({
  tdeeKcal: z.number(),
  dailyKcalTarget: z.number(),
  proteinGrams: z.number(),
  carbGrams: z.number(),
  fatGrams: z.number(),
});

/** Single ingredient in a diet meal with gram weight and visual portion. */
export const dietIngredientSchema = z.object({
  name: z.string(),
  quantityGrams: z.number(),
  visualPortion: z.string().optional(),
});

/** Single meal in the daily plan. */
export const dietMealSchema = z.object({
  name: z.string(),
  ingredients: z.array(dietIngredientSchema),
  prepInstructions: z.string(),
  prepTimeMins: z.number().optional(),
});

/** Full diet output schema for AI generateObject. */
export const dietOutputSchema = z.object({
  targets: dietTargetsSchema,
  meals: z.array(dietMealSchema),
  hydrationNote: z.string(),
  micronutrientNote: z.string(),
});

export type DietTargets = z.infer<typeof dietTargetsSchema>;
export type DietIngredient = z.infer<typeof dietIngredientSchema>;
export type DietMeal = z.infer<typeof dietMealSchema>;
export type DietOutput = z.infer<typeof dietOutputSchema>;
