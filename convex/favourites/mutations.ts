import { v } from "convex/values";
import { authMutation } from "../custom/mutation";

/**
 * Add a meal to the current user's favourites.
 * Idempotent: if already favourited, no-op. Increments meal.favouriteCount.
 */
export const addToFavourites = authMutation({
  args: { mealId: v.id("meals") },
  handler: async (ctx, { mealId }) => {
    const existing = await ctx.db
      .query("mealFavourites")
      .withIndex("by_user_and_meal", (q) =>
        q.eq("userId", ctx.user.id).eq("mealId", mealId),
      )
      .first();

    if (existing) return;

    const meal = await ctx.db.get(mealId);
    if (!meal) throw new Error("Meal not found");

    const now = Date.now();
    await ctx.db.insert("mealFavourites", {
      userId: ctx.user.id,
      mealId,
      createdAt: now,
      updatedAt: now,
    });

    const currentCount = meal.favouriteCount ?? 0;
    await ctx.db.patch(mealId, {
      favouriteCount: currentCount + 1,
      updatedAt: now,
    });
  },
});

/**
 * Remove a meal from the current user's favourites.
 * Decrements meal.favouriteCount (floored at 0).
 */
export const removeFromFavourites = authMutation({
  args: { mealId: v.id("meals") },
  handler: async (ctx, { mealId }) => {
    const existing = await ctx.db
      .query("mealFavourites")
      .withIndex("by_user_and_meal", (q) =>
        q.eq("userId", ctx.user.id).eq("mealId", mealId),
      )
      .first();

    if (!existing) return;

    await ctx.db.delete(existing._id);

    const meal = await ctx.db.get(mealId);
    if (meal) {
      const currentCount = meal.favouriteCount ?? 0;
      await ctx.db.patch(mealId, {
        favouriteCount: Math.max(0, currentCount - 1),
        updatedAt: Date.now(),
      });
    }
  },
});
