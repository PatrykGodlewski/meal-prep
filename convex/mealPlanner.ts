/**
 * Weekly meal plan generation: Hard Filtering + Weighted Scoring.
 *
 * Follows Convex Zen & Best Practices:
 * - Don't invoke actions directly from the app – mutation creates request, schedules action.
 * - Workflow: mutation → action → internal mutation (records result). App queries the request.
 * - Use internal functions only for ctx.run* / scheduler.
 * - Logic in model/mealPlanner.ts (plain TS helpers).
 * - Avoid unbounded .collect – use .take() when no diet filter.
 *
 * @see https://docs.convex.dev/understanding/zen
 * @see https://docs.convex.dev/understanding/best-practices
 */

import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { Doc } from "./_generated/dataModel";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { authMutation } from "./custom/mutation";
import { authQuery } from "./custom/query";
import { internal } from "./_generated/api";
import { STRICT_DIETS } from "./schema";
import * as MealPlanner from "./model/mealPlanner";

const DEFAULT_TOP_N = 21;
const BATCH_SIZE = 100;
/** Max meals to consider when no diet filter – avoids unbounded .collect(). */
const MAX_MEALS_WHEN_NO_DIET = 2000;

// ---------------------------------------------------------------------------
// Internal query: planner input (prefs + meal IDs) – single call for consistency
// ---------------------------------------------------------------------------

export const getPlannerInput = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const ingredientPrefs = await ctx.db
      .query("ingredientPreferences")
      .withIndex("by_user_and_type", (q) => q.eq("userId", userId))
      .collect();

    const strictDiets =
      prefs?.dietary?.strictDiets?.filter((d) => d !== "none") ?? [];
    const allergies =
      prefs?.dietary?.allergies?.filter((a) => a !== "none") ?? [];
    const maxCookingTimeMins = prefs?.logistics?.maxCookingTimeMins ?? undefined;

    const ingredientWeights: Record<string, number> = {
      ...(prefs?.ingredientWeights ?? {}),
    };
    for (const p of ingredientPrefs) {
      const id = p.ingredientId as string;
      ingredientWeights[id] =
        p.preferenceType === "always_include"
          ? (ingredientWeights[id] ?? 0) + p.score
          : (ingredientWeights[id] ?? 0) - Math.abs(p.score);
    }

    const validDiets = strictDiets.filter((d) =>
      STRICT_DIETS.includes(d as (typeof STRICT_DIETS)[number]),
    );

    // Convex eq() on array index expects full array, not containment.
    // Filter in code after take() to avoid unbounded collect.
    const meals = await ctx.db
      .query("meals")
      .take(MAX_MEALS_WHEN_NO_DIET);

    const mealIds: Id<"meals">[] =
      validDiets.length === 0
        ? meals.map((m) => m._id)
        : meals
            .filter((m) =>
              m.strictDietTags?.some((t) => validDiets.includes(t)),
            )
            .map((m) => m._id);

    return {
      allergies,
      maxCookingTimeMins,
      ingredientWeights,
      mealIds,
    };
  },
});

// ---------------------------------------------------------------------------
// Internal query: meals + ingredient IDs for a batch
// ---------------------------------------------------------------------------

export const getMealsWithIngredientIdsBatch = internalQuery({
  args: { mealIds: v.array(v.id("meals")) },
  handler: async (ctx, { mealIds }) => {
    const results: {
      mealId: Id<"meals">;
      meal: Doc<"meals">;
      ingredientIds: Id<"ingredients">[];
    }[] = [];
    for (const mealId of mealIds) {
      const meal = await ctx.db.get(mealId);
      if (!meal) continue;
      const ingredients = await ctx.db
        .query("mealIngredients")
        .withIndex("by_meal", (q) => q.eq("mealId", mealId))
        .collect();
      const ingredientIds = ingredients
        .map((mi) => mi.ingredientId)
        .filter((id): id is Id<"ingredients"> => id !== undefined);
      results.push({ mealId, meal, ingredientIds });
    }
    return results;
  },
});

// ---------------------------------------------------------------------------
// Internal mutation: record plan generation result
// ---------------------------------------------------------------------------

export const recordPlanResult = internalMutation({
  args: {
    requestId: v.id("planGenerationRequests"),
    status: v.union(
      v.literal("completed"),
      v.literal("failed"),
      v.literal("running"),
    ),
    result: v.optional(
      v.array(
        v.object({
          mealId: v.id("meals"),
          matchScore: v.number(),
          meal: v.object({
            _id: v.id("meals"),
            name: v.string(),
            categories: v.array(v.string()),
            prepTimeMinutes: v.optional(v.number()),
            cookTimeMinutes: v.optional(v.number()),
            communityRating: v.optional(v.number()),
            imageUrl: v.optional(v.string()),
          }),
        }),
      ),
    ),
    error: v.optional(v.string()),
  },
  handler: async (ctx, { requestId, status, result, error }) => {
    const now = Date.now();
    await ctx.db.patch(requestId, {
      status,
      result,
      error,
      updatedAt: now,
    });
  },
});

// ---------------------------------------------------------------------------
// Internal action: run scoring workflow (scheduled by mutation)
// ---------------------------------------------------------------------------

export const runGeneration = internalAction({
  args: {
    requestId: v.id("planGenerationRequests"),
    userId: v.id("users"),
    limit: v.number(),
  },
  handler: async (ctx, { requestId, userId, limit }) => {
    await ctx.runMutation(internal.mealPlanner.recordPlanResult, {
      requestId,
      status: "running",
    });

    try {
      const input = await ctx.runQuery(
        internal.mealPlanner.getPlannerInput,
        { userId },
      );

      const scored: { mealId: Id<"meals">; meal: Doc<"meals">; matchScore: number }[] =
        [];

      for (let i = 0; i < input.mealIds.length; i += BATCH_SIZE) {
        const batchIds = input.mealIds.slice(i, i + BATCH_SIZE);
        const batch = await ctx.runQuery(
          internal.mealPlanner.getMealsWithIngredientIdsBatch,
          { mealIds: batchIds },
        );
        for (const { mealId, meal, ingredientIds } of batch) {
          if (
            !MealPlanner.mealPassesAllergyFilter(meal.allergens, input.allergies)
          )
            continue;
          const matchScore = MealPlanner.scoreMeal(
            meal,
            ingredientIds,
            input.ingredientWeights,
            input.maxCookingTimeMins,
          );
          scored.push({ mealId, meal, matchScore });
        }
      }

      scored.sort((a, b) => b.matchScore - a.matchScore);
      const top = scored.slice(0, limit);

      const result = top.map(({ mealId, meal, matchScore }) => ({
        mealId,
        matchScore,
        meal: {
          _id: meal._id,
          name: meal.name,
          categories: meal.categories,
          prepTimeMinutes: meal.prepTimeMinutes,
          cookTimeMinutes: meal.cookTimeMinutes,
          communityRating: meal.communityRating,
          imageUrl: meal.imageUrl,
        },
      }));

      await ctx.runMutation(internal.mealPlanner.recordPlanResult, {
        requestId,
        status: "completed",
        result,
      });
    } catch (err) {
      await ctx.runMutation(internal.mealPlanner.recordPlanResult, {
        requestId,
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  },
});

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Mutation creates request + schedules action. App follows with queries. */
export const requestWeeklyPlanGeneration = authMutation({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit: limitArg }) => {
    const limit = limitArg ?? DEFAULT_TOP_N;
    const now = Date.now();

    const requestId = await ctx.db.insert("planGenerationRequests", {
      userId: ctx.user.id,
      status: "pending",
      limit,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.scheduler.runAfter(
      0,
      internal.mealPlanner.runGeneration,
      {
        requestId,
        userId: ctx.user.id,
        limit,
      },
    );

    return requestId;
  },
});

/** Get a plan generation request by id. */
export const getPlanGenerationRequest = authQuery({
  args: { requestId: v.id("planGenerationRequests") },
  handler: async (ctx, { requestId }) => {
    const req = await ctx.db.get(requestId);
    if (!req || req.userId !== ctx.user.id) return null;
    return req;
  },
});

/** Get user's latest plan generation request. */
export const getLatestPlanGenerationForUser = authQuery({
  args: {},
  handler: async (ctx) => {
    const req = await ctx.db
      .query("planGenerationRequests")
      .withIndex("by_user_and_created", (q) => q.eq("userId", ctx.user.id))
      .order("desc")
      .first();
    return req;
  },
});
