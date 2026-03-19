import { v } from "convex/values";
import { internalQuery } from "../_generated/server";
import { authQuery } from "../custom/query";

/**
 * Internal query: fetch user preferences for diet generation.
 */
export const getDietInput = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const allergies =
      prefs?.dietary?.allergies?.filter((a) => a !== "none") ?? [];
    const strictDiets =
      prefs?.dietary?.strictDiets?.filter((d) => d !== "none") ?? [];
    const preferredTypes = prefs?.dishTypes?.preferredTypes ?? [];
    const avoidedTypes = prefs?.dishTypes?.avoidedTypes ?? [];
    const mealsPerDay = prefs?.logistics?.mealsPerDay ?? 3;
    const snacksPerDay = prefs?.logistics?.snacksPerDay ?? 0;
    const maxCookingTimeMins = prefs?.logistics?.maxCookingTimeMins ?? 30;

    const favouriteRows = await ctx.db
      .query("mealFavourites")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const favouriteMealNames: string[] = [];
    for (const row of favouriteRows) {
      const meal = await ctx.db.get(row.mealId);
      if (meal?.name) favouriteMealNames.push(meal.name);
    }

    const ingredientPrefs = await ctx.db
      .query("ingredientPreferences")
      .withIndex("by_user_and_type", (q) => q.eq("userId", userId))
      .collect();
    const likedIngredients: string[] = [];
    const dislikedIngredients: string[] = [];
    for (const p of ingredientPrefs) {
      const ing = await ctx.db.get(p.ingredientId);
      if (ing?.name) {
        if (p.preferenceType === "always_include") likedIngredients.push(ing.name);
        else dislikedIngredients.push(ing.name);
      }
    }

    return {
      biometrics: prefs?.biometrics,
      allergies,
      strictDiets,
      preferredTypes,
      avoidedTypes,
      mealsPerDay,
      snacksPerDay,
      maxCookingTimeMins,
      favouriteMealNames,
      likedIngredients,
      dislikedIngredients,
    };
  },
});

/** Auth query: get the current user's personalized diet. */
export const getDietForUser = authQuery({
  args: {},
  handler: async (ctx) => {
    const diet = await ctx.db
      .query("personalizedDiets")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user.id))
      .first();
    return diet;
  },
});
