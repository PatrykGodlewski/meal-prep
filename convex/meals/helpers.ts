import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalMutation } from "../_generated/server";

import type { INGREDIENT_CATEGORIES, UNITS } from "../schema";

const areCategoriesDifferent = (
  oldCategories: string[],
  newCategories: string[],
): boolean => {
  if (oldCategories.length !== newCategories.length) {
    return true;
  }
  const newCategorySet = new Set(newCategories);
  return oldCategories.some((category) => !newCategorySet.has(category));
};

export const handleCategoryChanges = internalMutation({
  args: {
    mealId: v.id("meals"),
    oldCategories: v.array(v.string()),
    newCategories: v.array(v.string()),
  },
  handler: async (ctx, { mealId, oldCategories, newCategories }) => {
    if (!areCategoriesDifferent(oldCategories, newCategories)) {
      return;
    }

    const currentMealPlannedMeals = await ctx.db
      .query("planMeals")
      .withIndex("by_meal", (q) => q.eq("mealId", mealId))
      .collect();

    await Promise.all(
      currentMealPlannedMeals.map((plannedMeal) => {
        if (
          plannedMeal?.category &&
          newCategories?.includes(plannedMeal.category)
        )
          return;

        return ctx.db.delete(plannedMeal._id);
      }),
    );
  },
});

export const updateMealIngredients = internalMutation({
  args: {
    mealId: v.id("meals"),
    ingredients: v.array(
      v.object({
        ingredientId: v.optional(v.id("ingredients")),
        name: v.string(),
        quantity: v.number(),
        calories: v.optional(v.number()),
        // TODO: come back to this
        unit: v.optional(v.string()),
        category: v.optional(v.string()),
        isOptional: v.optional(v.boolean()),
        notes: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, { mealId, ingredients }) => {
    const now = Date.now();
    const oldMealIngredients = await ctx.db
      .query("mealIngredients")
      .withIndex("by_meal", (q) => q.eq("mealId", mealId))
      .collect();

    await Promise.all(oldMealIngredients.map((mi) => ctx.db.delete(mi._id)));

    await Promise.all(
      ingredients.map(async (ingredient) => {
        const ingredientId = await ctx.runMutation(
          internal.ingredients.mutations.upsertIngredient,
          {
            ingredient: {
              ...ingredient,
              category:
                (ingredient.category as (typeof INGREDIENT_CATEGORIES)[number]) ||
                "other",
              unit: (ingredient.unit as (typeof UNITS)[number]) || "g",
            },
          },
        );

        await ctx.db.insert("mealIngredients", {
          mealId: mealId,
          ingredientId: ingredientId,
          quantity: ingredient.quantity,
          isOptional: ingredient.isOptional ?? false,
          notes: ingredient.notes,
          createdAt: now,
          updatedAt: now,
        });
      }),
    );
  },
});
