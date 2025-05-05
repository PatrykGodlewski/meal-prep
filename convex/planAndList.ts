import { v } from "convex/values";
import { api } from "./_generated/api";
import { mutation } from "./_generated/server";

export const generatePlanAndShoppingList = mutation({
  args: {
    weekStart: v.number(),
  },
  handler: async (ctx, { weekStart }) => {
    try {
      const { mealPlanIds } = await ctx.runMutation(
        api.mealPlans.generateMealPlan,
        {
          weekStart,
        },
      );

      await Promise.all(
        mealPlanIds.map((id) =>
          ctx.runMutation(api.shoppingList.generateShoppingList, {
            mealPlanId: id,
          }),
        ),
      );

      return { success: true };
    } catch (error) {
      console.error("Error generating plan and shopping list:", error);
      // TODO:
      // Propagate the error or return a specific error structure
      // For simplicity, re-throwing allows the client's onError to catch it.
      // Alternatively: return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
      throw error; // Let the client handle the error state
    }
  },
});
