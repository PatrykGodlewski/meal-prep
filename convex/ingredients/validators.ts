import { zid, zodOutputToConvex } from "convex-helpers/server/zod";
import type { z } from "zod";
import { ingredientSchema, mealIngredientsSchema } from "../schema";

export const mutationIngredientSchema = ingredientSchema.omit({
  createdAt: true,
});

export const mutationIngredientValidator = zodOutputToConvex(
  mutationIngredientSchema,
);

export const mutationMealIngredientsSchema = mutationIngredientSchema
  .merge(mealIngredientsSchema)
  .omit({ mealId: true, createdAt: true })
  .partial()
  .required({ name: true, quantity: true });

export type MutationMealIngredientValues = z.infer<
  typeof mutationMealIngredientsSchema
>;

export const mutationMealIngredientsValidator = zodOutputToConvex(
  mutationMealIngredientsSchema,
);
