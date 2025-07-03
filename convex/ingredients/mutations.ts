import { v } from "convex/values";
import { z } from "zod";
import { internalMutation } from "../_generated/server";
import { authMutation } from "../custom/mutation";
import { DEFAULT_INGREDIENT_CATEGORY, UNITS } from "../schema";
import {
  mutationIngredientValidator,
  mutationMealIngredientsValidator,
} from "./validators";

export const createIngredient = authMutation({
  args: mutationIngredientValidator,
  handler: async (ctx, { name, category, unit, calories }) => {
    const now = Date.now();
    return await ctx.db.insert("ingredients", {
      name,
      category,
      unit,
      calories: calories ?? 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const upsertIngredient = internalMutation({
  args: {
    ingredient: mutationMealIngredientsValidator,
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const DEFAULT_UNIT = UNITS[0];
    const DEFAULT_CALORIES = 0;

    const { ingredientId, name, category, unit, calories } = args.ingredient;

    if (!ingredientId) {
      return await ctx.db.insert("ingredients", {
        name,
        category: category ?? DEFAULT_INGREDIENT_CATEGORY,
        unit: unit ?? DEFAULT_UNIT,
        calories: calories ?? DEFAULT_CALORIES,
        createdAt: now,
        updatedAt: now,
      });
    }

    await ctx.db.patch(ingredientId, {
      name,
      ...(category ? { category: category } : null),
      ...(unit ? { unit: unit } : null),
      ...(z.number().safeParse(calories).success
        ? { calories: calories }
        : null),
      updatedAt: now,
    });

    return ingredientId;
  },
});

export const deleteIngredient = authMutation({
  args: { ingredientId: v.id("ingredients") },
  handler: async (ctx, { ingredientId }) => {
    return await ctx.db.delete(ingredientId);
  },
});
