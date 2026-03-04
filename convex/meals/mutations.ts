import { v } from "convex/values";
import { internal } from "../_generated/api";
import { authMutation } from "../custom/mutation";
import * as ShoppingList from "../model/shoppingList";
import {
  mutationMealAddValidator,
  mutationMealEditValidator,
} from "./validators";

export const addMeal = authMutation({
  args: mutationMealAddValidator,
  handler: async (ctx, args) => {
    try {
      const userId = ctx.user.id;
      const now = Date.now();

      const { ingredients, ...mealData } = args;

      const ingredientNames = ingredients.map((i) => i.name).join(" ");
      const searchContent = `${mealData.name} ${ingredientNames}`;

      const mealId = await ctx.db.insert("meals", {
        ...mealData,
        searchContent,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      });

      ctx.scheduler.runAfter(0, internal.ai.embeddings.generateAndStoreEmbedding, {
        mealId,
      });

      await Promise.all(
        ingredients.map(async (ingredient) => {
          const finalIngredientId = await ctx.runMutation(
            internal.ingredients.mutations.upsertIngredient,
            { ingredient },
          );

          return ctx.db.insert("mealIngredients", {
            mealId,
            ingredientId: finalIngredientId,
            quantity: ingredient.quantity,
            isOptional: ingredient.isOptional ?? false,
            notes: ingredient.notes,
            allowedReplacements: ingredient.allowedReplacements,
            createdAt: now,
            updatedAt: now,
          });
        }),
      );

      return { success: true, mealId };
    } catch (error) {
      console.error(error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

export const editMeal = authMutation({
  args: mutationMealEditValidator,
  handler: async (ctx, args) => {
    try {
      const meal = await ctx.db.get(args.mealId);
      if (!meal) throw new Error("Meal not found");
      if (meal.createdBy !== ctx.user.id) throw new Error("Unauthorized");

      const now = Date.now();
      const { ingredients, mealId, ...newMeal } = args;

      const finalName = newMeal.name ?? meal.name;

      const ingredientNames = ingredients.map((i) => i.name).join(" ");

      const searchContent = `${finalName} ${ingredientNames}`;

      await ctx.db.patch(args.mealId, {
        ...newMeal,
        searchContent,
        updatedAt: now,
      });

      ctx.scheduler.runAfter(0, internal.ai.embeddings.generateAndStoreEmbedding, {
        mealId: args.mealId,
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

      const plannedMealsEntries = await ctx.db
        .query("planMeals")
        .withIndex("by_meal", (q) => q.eq("mealId", args.mealId))
        .collect();

      await Promise.all(
        plannedMealsEntries.map(({ planId }) =>
          ShoppingList.generateShoppingList(ctx, { planId }),
        ),
      );

      return { success: true };
    } catch (error) {
      console.error(error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

export const deleteMeal = authMutation({
  args: { mealId: v.id("meals") },
  handler: async (ctx, { mealId }) => {
    try {
      const meal = await ctx.db.get(mealId);
      if (!meal) throw new Error("Meal not found");
      if (meal.createdBy !== ctx.user.id) throw new Error("Unauthorized");

      const mealIngredients = await ctx.db
        .query("mealIngredients")
        .withIndex("by_meal", (q) => q.eq("mealId", mealId))
        .collect();

      await Promise.all(mealIngredients.map((mi) => ctx.db.delete(mi._id)));

      await ctx.db.delete(mealId);

      return { success: true };
    } catch (error) {
      console.error(error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
