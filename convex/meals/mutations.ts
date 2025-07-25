import { v } from "convex/values";
import { internal } from "../_generated/api";
import { authMutation } from "../custom/mutation";
import * as ShoppingList from "../model/shoppingList";
import {
  mutationMealAddValidator,
  mutationMealEditValidator,
} from "./validators";

/**
 * Adds a new meal to the database.
 *
 * @param {object} args - The arguments.
 * @param {object} args.mealData - The meal data.
 * @param {object[]} args.ingredients - The meal ingredients.
 * @returns {Promise<object>} An object with the success status and the new meal's ID.
 */
export const addMeal = authMutation({
  args: mutationMealAddValidator,
  handler: async (ctx, args) => {
    try {
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
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: "An unknown error occurred." };
    }
  },
});

/**
 * Edits an existing meal in the database.
 *
 * @param {object} args - The arguments.
 * @param {string} args.mealId - The ID of the meal to edit.
 * @param {object} args.newMeal - The new meal data.
 * @param {object[]} args.ingredients - The new meal ingredients.
 * @returns {Promise<object>} An object with the success status.
 */
export const editMeal = authMutation({
  args: mutationMealEditValidator,
  handler: async (ctx, args) => {
    try {
      const meal = await ctx.db.get(args.mealId);
      if (!meal) {
        throw new Error("Meal not found");
      }
      if (meal.createdBy !== ctx.user.id) {
        throw new Error("You are not authorized to edit this meal");
      }

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

      // TODO should update items in shopping list of affected ingredients in this meal, currently it is regenerating whole shopping list if meal was edited
      const plannedMealsEntries = await ctx.db
        .query("planMeals")
        .withIndex("by_meal", (q) => q.eq("mealId", args.mealId))
        .collect();

      for (const { planId } of plannedMealsEntries) {
        await ShoppingList.generateShoppingList(ctx, { planId });
      }

      return { success: true };
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: "An unknown error occurred." };
    }
  },
});

/**
 * Deletes a meal from the database.
 *
 * @param {object} args - The arguments.
 * @param {string} args.mealId - The ID of the meal to delete.
 * @returns {Promise<object>} An object with the success status.
 */
export const deleteMeal = authMutation({
  args: { mealId: v.id("meals") },
  handler: async (ctx, { mealId }) => {
    try {
      const meal = await ctx.db.get(mealId);
      if (!meal) {
        throw new Error("Meal not found");
      }
      if (meal.createdBy !== ctx.user.id) {
        throw new Error("You are not authorized to delete this meal");
      }

      const mealIngredients = await ctx.db
        .query("mealIngredients")
        .withIndex("by_meal", (q) => q.eq("mealId", mealId))
        .collect();
      await Promise.all(mealIngredients.map((mi) => ctx.db.delete(mi._id)));

      await ctx.db.delete(mealId);

      return { success: true };
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: "An unknown error occurred." };
    }
  },
});
