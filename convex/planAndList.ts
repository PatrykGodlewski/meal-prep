import { v } from "convex/values";
import { api } from "./_generated/api";
import { authMutation } from "./custom/mutation";
import * as ShoppingList from "./model/shoppingList";

export const generatePlanAndShoppingList = authMutation({
  args: {
    weekStart: v.number(),
  },
  handler: async (ctx, { weekStart }) => {
    try {
      const fridgeItems = await ctx.db
        .query("fridgeItems")
        .withIndex("by_user", (q) => q.eq("userId", ctx.user.id))
        .collect();
      const existingIngredientIds = fridgeItems.map((fi) => fi.ingredientId);

      const { mealPlanIds } = await ctx.runMutation(
        api.plans.generateMealPlan,
        {
          weekStart,
          existingIngredientIds:
            existingIngredientIds.length > 0
              ? existingIngredientIds
              : undefined,
        },
      );

      await Promise.all(
        mealPlanIds.map((id) =>
          ShoppingList.generateShoppingList(ctx, { planId: id }),
        ),
      );

      return { success: true };
    } catch (error) {
      console.error("Error generating plan and shopping list:", error);
      throw error;
    }
  },
});
