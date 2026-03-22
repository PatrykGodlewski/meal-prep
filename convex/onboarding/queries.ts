import { v } from "convex/values";
import { authQuery } from "../custom/query";

/**
 * Lightweight query for guards. Returns only step and completed status.
 */
export const getOnboardingStatus = authQuery({
  args: {},
  handler: async (ctx) => {
    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user.id))
      .first();

    return {
      step: prefs?.onboardingStep ?? 0,
      completed: prefs?.onboardingCompleted ?? false,
    };
  },
});

/**
 * Returns only the slice needed for the given step (performance-focused).
 * Step 1 → biometrics, 2 → dietary, 3 → ingredientPreferences, 4 → logistics, 5 → appetite
 */
export const getPreferencesForStep = authQuery({
  args: { step: v.number() },
  handler: async (ctx, { step }) => {
    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user.id))
      .first();

    const result: Record<string, unknown> = {
      step: prefs?.onboardingStep ?? 0,
    };

    if (step === 1 && prefs?.biometrics) {
      result.biometrics = prefs.biometrics;
    }
    if (step === 2 && prefs?.dietary) {
      result.dietary = prefs.dietary;
    }
    if (step === 4 && prefs?.logistics) {
      result.logistics = prefs.logistics;
    }
    if (step === 5 && prefs?.appetite) {
      result.appetite = prefs.appetite;
    }

    if (step === 3) {
      result.dishTypes = prefs?.dishTypes ?? {
        preferredTypes: [],
        avoidedTypes: [],
      };
    }

    return result;
  },
});

/**
 * Full preferences - use sparingly (e.g. summary before completion).
 */
export const getPreferences = authQuery({
  args: {},
  handler: async (ctx) => {
    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user.id))
      .first();

    const ingredientPrefsRaw = await ctx.db
      .query("ingredientPreferences")
      .withIndex("by_user_and_type", (q) => q.eq("userId", ctx.user.id))
      .collect();

    const ingredientPreferences = await Promise.all(
      ingredientPrefsRaw.map(async (p) => {
        const ing = await ctx.db.get(p.ingredientId);
        return {
          ...p,
          name: ing?.name ?? "",
        };
      }),
    );

    return {
      preferences: prefs,
      ingredientPreferences,
    };
  },
});
