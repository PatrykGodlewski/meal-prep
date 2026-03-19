import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { authMutation } from "../custom/mutation";
import { internal } from "../_generated/api";

/**
 * Auth mutation: request diet generation. Creates or updates personalized diet
 * with status "pending" and schedules the generateDiet action.
 */
export const requestDietGeneration = authMutation({
  args: {
    locale: v.optional(v.string()),
  },
  handler: async (ctx, { locale }) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("personalizedDiets")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user.id))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: "pending",
        result: undefined,
        error: undefined,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("personalizedDiets", {
        userId: ctx.user.id,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      });
    }

    await ctx.scheduler.runAfter(0, internal.diet.action.generateDiet, {
      userId: ctx.user.id,
      locale,
    });
  },
});

/**
 * Internal mutation: record diet generation status and result.
 */
export const recordDietResult = internalMutation({
  args: {
    userId: v.id("users"),
    status: v.union(
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed")
    ),
    result: v.optional(v.any()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, { userId, status, result, error }) => {
    const now = Date.now();
    const doc = await ctx.db
      .query("personalizedDiets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (!doc) return;
    await ctx.db.patch(doc._id, {
      status,
      ...(result !== undefined && { result }),
      ...(error !== undefined && { error }),
      updatedAt: now,
    });
  },
});
