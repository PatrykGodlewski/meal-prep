import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * Action to generate a weekly meal plan and its corresponding shopping list.
 * It orchestrates calls to the respective mutations.
 */
export const generatePlanAndShoppingList = mutation({
  args: {
    weekStart: v.number(),
  },
  handler: async (ctx, { weekStart }) => {
    try {
      // Step 1: Generate the meal plan for the week
      // This mutation should handle deleting old plans for the week before creating new ones.
      const { mealPlanIds } = await ctx.runMutation(
        api.mealPlans.generateMealPlan,
        {
          weekStart,
        },
      );

      await Promise.all(
        mealPlanIds.map((id) =>
          ctx.runMutation(api.shoppingList.generateShoppingList, {
            mealPlanId: id, // Pass the single meal plan ID
          }),
        ),
      );

      // Indicate overall success
      return { success: true };
    } catch (error) {
      console.error("Error generating plan and shopping list:", error);
      // Propagate the error or return a specific error structure
      // For simplicity, re-throwing allows the client's onError to catch it.
      // Alternatively: return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
      throw error; // Let the client handle the error state
    }
  },
});
