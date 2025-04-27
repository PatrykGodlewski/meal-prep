import { v } from "convex/values";
import { authMutation } from "../custom/mutation";
import { internal } from "../_generated/api";
import {
  mutationMealAddValidator,
  mutationMealEditValidator,
} from "./validators";

export const addMeal = authMutation({
  args: mutationMealAddValidator,
  handler: async (ctx, args) => {
    const userId = ctx.user.id;
    const now = Date.now();

    const { ingredients, ...mealData } = args;

    const mealId = await ctx.db.insert("meals", {
      ...mealData,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    await Promise.all(
      ingredients.map(async (ingredient) => {
        const finalIngredientId = await ctx.runMutation(
          internal.ingredients.mutations.upsertIngredient,
          {
            ingredient,
          },
        );

        return ctx.db.insert("mealIngredients", {
          mealId,
          ingredientId: finalIngredientId,
          quantity: ingredient.quantity,
          isOptional: ingredient.isOptional ?? false,
          notes: ingredient.notes,
          createdAt: now,
          updatedAt: now,
        });
      }),
    );

    return { success: true, mealId };
  },
});

export const editMeal = authMutation({
  args: mutationMealEditValidator,
  handler: async (ctx, args) => {
    const meal = await ctx.db.get(args.mealId);
    if (!meal) throw new Error("Meal not found");
    if (meal.createdBy !== ctx.user.id) throw new Error("Not your meal");

    const now = Date.now();
    const { ingredients, mealId, ...newMeal } = args;

    await ctx.db.patch(args.mealId, {
      ...newMeal,
      updatedAt: now,
    });

    const oldMealIngredients = await ctx.db
      .query("mealIngredients")
      .withIndex("by_meal", (q) => q.eq("mealId", args.mealId))
      .collect();

    // Functionally compare category arrays for differences (length or content)
    const checkCategoryDifference = (
      oldCategories: string[],
      newCategories: string[],
    ): boolean => {
      if (oldCategories.length !== newCategories.length) {
        return true; // Different lengths mean they are different
      }
      // If lengths are the same, check if content differs
      const newCategorySet = new Set(newCategories);
      // Return true if any old category is NOT found in the new set
      return oldCategories.some((category) => !newCategorySet.has(category));
    };

    const isDifferentMealCategory = checkCategoryDifference(
      meal.categories,
      newMeal.categories,
    );

    if (isDifferentMealCategory) {
      // If categories changed, remove this meal from any existing meal plans
      // as its category assignment might no longer be valid for those slots.
      const currentMealPlannedMeals = await ctx.db
        .query("plannedMeals")
        .withIndex("by_meal", (q) => q.eq("mealId", args.mealId))
        .collect();

      await Promise.all(
        currentMealPlannedMeals.map((plannedMeal) => {
          if (
            plannedMeal?.category &&
            newMeal.categories.includes(plannedMeal.category)
          )
            return;
          return ctx.db.delete(plannedMeal._id);
        }),
      );
    }

    await Promise.all(oldMealIngredients.map((mi) => ctx.db.delete(mi._id)));

    await Promise.all(
      ingredients.map(async (ingredient) => {
        const ingredientId = await ctx.runMutation(
          internal.ingredients.mutations.upsertIngredient,
          {
            ingredient,
          },
        );

        await ctx.db.insert("mealIngredients", {
          mealId: args.mealId,
          ingredientId: ingredientId,
          quantity: ingredient.quantity,
          isOptional: ingredient.isOptional ?? false,
          notes: ingredient.notes,
          createdAt: now,
          updatedAt: now,
        });
      }),
    );

    return { success: true };
  },
});

export const deleteMeal = authMutation({
  args: { mealId: v.id("meals") },
  handler: async (ctx, { mealId }) => {
    const meal = await ctx.db.get(mealId);
    if (!meal) throw new Error("Meal not found");
    if (meal.createdBy !== ctx.user.id) throw new Error("Not your meal");

    const mealIngredients = await ctx.db
      .query("mealIngredients")
      .withIndex("by_meal", (q) => q.eq("mealId", mealId))
      .collect();
    await Promise.all(mealIngredients.map((mi) => ctx.db.delete(mi._id)));

    await ctx.db.delete(mealId);

    return { success: true };
  },
});
