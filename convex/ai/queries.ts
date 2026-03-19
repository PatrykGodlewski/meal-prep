import { v } from "convex/values";
import { internalQuery, query } from "../_generated/server";
import { authQuery } from "../custom/query";

/**
 * Internal query: fetch user preferences for RAG (allergies, likes, favourite meals).
 */
export const getRAGInput = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const allergies =
      prefs?.dietary?.allergies?.filter((a) => a !== "none") ?? [];
    const likes =
      prefs?.dishTypes?.preferredTypes ?? [];
    const avoided =
      prefs?.dishTypes?.avoidedTypes ?? [];

    const favouriteRows = await ctx.db
      .query("mealFavourites")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const favouriteMealNames: string[] = [];
    for (const row of favouriteRows) {
      const meal = await ctx.db.get(row.mealId);
      if (meal?.name) favouriteMealNames.push(meal.name);
    }

    return {
      allergies,
      likes,
      avoided,
      favouriteMealNames,
    };
  },
});

/**
 * Auth query: fetch a meal generation request by ID for UI subscription.
 */
export const getMealGenerationRequest = authQuery({
  args: { requestId: v.id("mealGenerationRequests") },
  handler: async (ctx, { requestId }) => {
    const doc = await ctx.db.get(requestId);
    if (!doc || doc.userId !== ctx.user.id) return null;
    return doc;
  },
});

/**
 * Internal query: fetch meal data needed for embedding generation.
 * Used by generateAndStoreEmbedding action.
 */
export const getMealForEmbedding = internalQuery({
  args: { mealId: v.id("meals") },
  handler: async (ctx, { mealId }) => {
    const meal = await ctx.db.get(mealId);
    if (!meal) return null;
    return {
      name: meal.name,
      description: meal.description,
      instructions: meal.instructions,
      searchContent: meal.searchContent,
    };
  },
});
