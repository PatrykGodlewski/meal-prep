import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { authMutation } from "../custom/mutation";
import { DEFAULT_INGREDIENT_CATEGORY, MEAL_CATEGORIES, UNITS } from "../schema";

const unitValidator = v.union(...UNITS.map((u) => v.literal(u)));

/**
 * Internal mutation: patch a meal with its embedding vector.
 * Called by generateAndStoreEmbedding action.
 */
export const patchMealEmbedding = internalMutation({
  args: {
    mealId: v.id("meals"),
    embedding: v.array(v.float64()),
  },
  handler: async (ctx, { mealId, embedding }) => {
    const meal = await ctx.db.get(mealId);
    if (!meal) return;
    const EMBEDDING_DIMENSIONS = 768;
    if (embedding.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(
        `Embedding must have ${EMBEDDING_DIMENSIONS} dimensions, got ${embedding.length}`,
      );
    }
    await ctx.db.patch(mealId, {
      embedding,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Internal mutation: persist a generated meal from RAG output.
 * Called by generateMealWithContext action.
 */
export const persistGeneratedMeal = internalMutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    prepTimeMinutes: v.optional(v.number()),
    cookTimeMinutes: v.optional(v.number()),
    imageUrl: v.optional(v.string()),
    ingredients: v.array(
      v.object({
        name: v.string(),
        quantity: v.number(),
        unit: unitValidator,
      }),
    ),
    instructions: v.string(),
    calories: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const ingredientNames = args.ingredients.map((i) => i.name).join(" ");
    const searchContent = `${args.title} ${ingredientNames}`;

    const categories =
      args.category && MEAL_CATEGORIES.includes(args.category as (typeof MEAL_CATEGORIES)[number])
        ? [args.category as (typeof MEAL_CATEGORIES)[number]]
        : [];

    const mealId = await ctx.db.insert("meals", {
      name: args.title,
      description: args.description,
      instructions: args.instructions,
      prepTimeMinutes: args.prepTimeMinutes,
      cookTimeMinutes: args.cookTimeMinutes,
      calories: args.calories,
      categories,
      imageUrl: args.imageUrl,
      searchContent,
      isPublic: false,
      createdBy: args.userId,
      createdAt: now,
      updatedAt: now,
    });

    for (const ing of args.ingredients) {
      const ingredientId = await ctx.runMutation(
        internal.ingredients.mutations.upsertIngredient,
        {
          ingredient: {
            name: ing.name,
            category: DEFAULT_INGREDIENT_CATEGORY,
            unit: ing.unit,
            quantity: ing.quantity,
            isOptional: false,
            updatedAt: now,
          },
        },
      );

      await ctx.db.insert("mealIngredients", {
        mealId,
        ingredientId,
        quantity: ing.quantity,
        isOptional: false,
        createdAt: now,
        updatedAt: now,
      });
    }

    return mealId;
  },
});

/**
 * Auth mutation: create meal generation request and schedule action.
 * Returns requestId immediately for optimistic UI.
 */
export const requestMealGeneration = authMutation({
  args: {
    prompt: v.string(),
    locale: v.optional(v.string()),
    planId: v.optional(v.id("plans")),
    date: v.optional(v.number()),
  },
  handler: async (ctx, { prompt, locale, planId, date }) => {
    const now = Date.now();
    const requestId = await ctx.db.insert("mealGenerationRequests", {
      userId: ctx.user.id,
      status: "pending",
      prompt,
      planId,
      date,
      createdAt: now,
      updatedAt: now,
    });

    ctx.scheduler.runAfter(0, internal.ai.action.generateMealWithContext, {
      requestId,
      userId: ctx.user.id,
      prompt,
      locale,
      planId,
      date,
    });

    return requestId;
  },
});

/**
 * Internal mutation: update meal generation request status.
 */
export const recordMealGenerationResult = internalMutation({
  args: {
    requestId: v.id("mealGenerationRequests"),
    status: v.union(
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    mealId: v.optional(v.id("meals")),
    result: v.optional(v.any()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, { requestId, status, mealId, result, error }) => {
    const now = Date.now();
    const patch: Record<string, unknown> = {
      status,
      updatedAt: now,
    };
    if (mealId !== undefined) patch.mealId = mealId;
    if (result !== undefined) patch.result = result;
    if (error !== undefined) patch.error = error;
    await ctx.db.patch(requestId, patch);
  },
});
