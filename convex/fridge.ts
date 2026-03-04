import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { authMutation } from "./custom/mutation";
import { authQuery } from "./custom/query";

export const getFridge = authQuery({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db
      .query("fridgeItems")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user.id))
      .collect();

    const ingredients = await Promise.all(
      items.map((item) => ctx.db.get(item.ingredientId)),
    );

    return items.map((item, i) => ({
      ...item,
      ingredient: ingredients[i] ?? null,
    }));
  },
});

export const addFridgeItems = authMutation({
  args: {
    items: v.array(
      v.object({
        ingredientId: v.id("ingredients"),
        amount: v.number(),
      }),
    ),
  },
  handler: async (ctx, { items }) => {
    for (const { ingredientId, amount } of items) {
      if (amount <= 0) continue;

      const existing = await ctx.db
        .query("fridgeItems")
        .withIndex("by_user_and_ingredient", (q) =>
          q.eq("userId", ctx.user.id).eq("ingredientId", ingredientId),
        )
        .first();

      const now = Date.now();

      if (existing) {
        await ctx.db.patch(existing._id, {
          amount: existing.amount + amount,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("fridgeItems", {
          userId: ctx.user.id,
          ingredientId,
          amount,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
    return { success: true };
  },
});

export const addFridgeItem = authMutation({
  args: {
    ingredientId: v.id("ingredients"),
    amount: v.number(),
  },
  handler: async (ctx, { ingredientId, amount }) => {
    if (amount <= 0) {
      throw new Error("Amount must be positive.");
    }

    const existing = await ctx.db
      .query("fridgeItems")
      .withIndex("by_user_and_ingredient", (q) =>
        q.eq("userId", ctx.user.id).eq("ingredientId", ingredientId),
      )
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        amount: existing.amount + amount,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("fridgeItems", {
      userId: ctx.user.id,
      ingredientId,
      amount,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateFridgeItem = authMutation({
  args: {
    fridgeItemId: v.id("fridgeItems"),
    amount: v.number(),
  },
  handler: async (ctx, { fridgeItemId, amount }) => {
    const item = await ctx.db.get(fridgeItemId);
    if (!item || item.userId !== ctx.user.id) {
      throw new Error("Fridge item not found.");
    }

    if (amount <= 0) {
      await ctx.db.delete(fridgeItemId);
      return { deleted: true };
    }

    await ctx.db.patch(fridgeItemId, {
      amount,
      updatedAt: Date.now(),
    });
    return { deleted: false };
  },
});

export const removeFridgeItem = authMutation({
  args: {
    fridgeItemId: v.id("fridgeItems"),
  },
  handler: async (ctx, { fridgeItemId }) => {
    const item = await ctx.db.get(fridgeItemId);
    if (!item || item.userId !== ctx.user.id) {
      throw new Error("Fridge item not found.");
    }
    await ctx.db.delete(fridgeItemId);
    return { success: true };
  },
});

export const setFridgeItems = authMutation({
  args: {
    items: v.array(
      v.object({
        ingredientId: v.id("ingredients"),
        amount: v.number(),
      }),
    ),
  },
  handler: async (ctx, { items }) => {
    const userId = ctx.user.id;
    const now = Date.now();

    const existingItems = await ctx.db
      .query("fridgeItems")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const itemsByIngredient = new Map(
      items
        .filter((i) => i.amount > 0)
        .map((i) => [i.ingredientId, i.amount]),
    );

    for (const existing of existingItems) {
      const newAmount = itemsByIngredient.get(existing.ingredientId);
      if (newAmount === undefined) {
        await ctx.db.delete(existing._id);
      } else {
        if (newAmount !== existing.amount) {
          await ctx.db.patch(existing._id, {
            amount: newAmount,
            updatedAt: now,
          });
        }
        itemsByIngredient.delete(existing.ingredientId);
      }
    }

    for (const [ingredientId, amount] of itemsByIngredient) {
      await ctx.db.insert("fridgeItems", {
        userId,
        ingredientId: ingredientId as Id<"ingredients">,
        amount,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { success: true };
  },
});
