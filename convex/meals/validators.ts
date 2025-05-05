import { zid, zodOutputToConvex } from "convex-helpers/server/zod";
import { z } from "zod";
import { mutationMealIngredientsSchema } from "../ingredients/validators";
import { mealSchema } from "../schema";

export const mutationMealAddSchema = mealSchema
  .merge(z.object({ ingredients: z.array(mutationMealIngredientsSchema) }))
  .omit({ createdAt: true, createdBy: true, updatedAt: true });

export type MutationMealAddValues = z.infer<typeof mutationMealAddSchema>;

export const mutationMealEditSchema = mutationMealAddSchema.extend({
  mealId: zid("meals"),
});

export type MutationMealEditValues = z.infer<typeof mutationMealEditSchema>;

export const mutationMealAddValidator = zodOutputToConvex(
  mutationMealAddSchema,
);

export const mutationMealEditValidator = zodOutputToConvex(
  mutationMealEditSchema,
);
