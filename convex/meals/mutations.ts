import { v } from "convex/values";
import { internal } from "../_generated/api";
import { authMutation } from "../custom/mutation";
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

    await ctx.runMutation(internal.meals.helpers.handleCategoryChanges, {
      mealId,
      oldCategories: meal.categories ?? [],
      newCategories: newMeal.categories ?? [],
    });

    await ctx.runMutation(internal.meals.helpers.updateMealIngredients, {
      mealId,
      ingredients,
    });

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
