import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { INGREDIENT_CATEGORIES, UNITS } from "./schema";
import { getAuthUserId } from "@convex-dev/auth/server";

// Find ingredient by name (case-insensitive)
export const findIngredientByName = query({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    // You may want to normalize name (e.g., toLowerCase)
    const found = await ctx.db
      .query("ingredients")
      .withIndex("by_name", (q) => q.eq("name", name))
      .first();
    return found ?? null;
  },
});

// Create a new ingredient
export const createIngredient = mutation({
  args: {
    name: v.string(),
    category: v.union(...INGREDIENT_CATEGORIES.map((c) => v.literal(c))),
    unit: v.union(...UNITS.map((u) => v.literal(u))),
  },
  handler: async (ctx, { name, category, unit }) => {
    const now = Date.now();
    const id = await ctx.db.insert("ingredients", {
      name,
      category,
      unit,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  },
});

export const getIngredients = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new Error("User must be authenticated to fetch ingredients.");
    }

    return ctx.db.query("ingredients").collect();
  },
});
