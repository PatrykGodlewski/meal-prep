import { v } from "convex/values";
import { authQuery } from "../custom/query";

/**
 * Whether the current user has favourited the given meal.
 */
export const isFavourited = authQuery({
  args: { mealId: v.id("meals") },
  handler: async (ctx, { mealId }) => {
    const row = await ctx.db
      .query("mealFavourites")
      .withIndex("by_user_and_meal", (q) =>
        q.eq("userId", ctx.user.id).eq("mealId", mealId),
      )
      .first();
    return !!row;
  },
});

/**
 * All meal IDs favourited by the current user (for planner / AI context).
 */
export const getUserFavouriteMealIds = authQuery({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("mealFavourites")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user.id))
      .collect();
    return rows.map((r) => r.mealId);
  },
});
