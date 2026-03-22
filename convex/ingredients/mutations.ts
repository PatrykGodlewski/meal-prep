import { v } from "convex/values";
import { z } from "zod";
import { internalMutation } from "../_generated/server";
import { authMutation } from "../custom/mutation";
import {
  DEFAULT_INGREDIENT_CATEGORY,
  INGREDIENT_CATEGORIES,
  UNITS,
} from "../schema";
import {
  mutationIngredientValidator,
  mutationMealIngredientsValidator,
} from "./validators";

export const createIngredient = authMutation({
  args: mutationIngredientValidator,
  handler: async (ctx, { name, category, unit, calories, replacementIds }) => {
    const now = Date.now();
    const nameLower = name.toLowerCase().trim();

    // Prevent duplicates (onion/Onion)
    const existing = await ctx.db
      .query("ingredients")
      .withIndex("by_name_lower", (q) => q.eq("nameLower", nameLower))
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("ingredients", {
      name: name.trim(),
      nameLower,
      category,
      unit,
      calories: calories ?? 0,
      replacementIds: replacementIds ?? [],
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const upsertIngredient = internalMutation({
  args: {
    ingredient: mutationMealIngredientsValidator,
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const DEFAULT_UNIT = UNITS[0];
    const DEFAULT_CALORIES = 0;

    const { ingredientId, name, category, unit, calories } = args.ingredient;
    const nameLower = name.toLowerCase().trim();

    if (!ingredientId) {
      // Look up existing ingredient by normalized name to prevent duplicates (onion/Onion/ONION)
      const existing = await ctx.db
        .query("ingredients")
        .withIndex("by_name_lower", (q) => q.eq("nameLower", nameLower))
        .first();

      if (existing) {
        return existing._id;
      }

      return await ctx.db.insert("ingredients", {
        name: name.trim(),
        nameLower,
        category: category ?? DEFAULT_INGREDIENT_CATEGORY,
        unit: unit ?? DEFAULT_UNIT,
        calories: calories ?? DEFAULT_CALORIES,
        createdAt: now,
        updatedAt: now,
      });
    }

    await ctx.db.patch(ingredientId, {
      name: name.trim(),
      nameLower,
      ...(category ? { category: category } : null),
      ...(unit ? { unit: unit } : null),
      ...(z.number().safeParse(calories).success
        ? { calories: calories }
        : null),
      updatedAt: now,
    });

    return ingredientId;
  },
});

const replacementEntryValidator = v.object({
  ingredientId: v.id("ingredients"),
  ratio: v.optional(v.number()),
});

export const updateIngredient = authMutation({
  args: {
    ingredientId: v.id("ingredients"),
    name: v.string(),
    category: v.union(...INGREDIENT_CATEGORIES.map((c) => v.literal(c))),
    unit: v.union(...UNITS.map((u) => v.literal(u))),
    calories: v.optional(v.number()),
    replacements: v.optional(v.array(replacementEntryValidator)),
  },
  handler: async (
    ctx,
    { ingredientId, name, category, unit, calories, replacements },
  ) => {
    const now = Date.now();
    const nameLower = name.toLowerCase().trim();

    const existing = await ctx.db.get(ingredientId);
    if (!existing) {
      throw new Error("Ingredient not found");
    }

    // Prevent duplicates (except for self) - if renaming to another existing name
    const duplicate = await ctx.db
      .query("ingredients")
      .withIndex("by_name_lower", (q) => q.eq("nameLower", nameLower))
      .first();

    if (duplicate && duplicate._id !== ingredientId) {
      throw new Error("An ingredient with this name already exists");
    }

    await ctx.db.patch(ingredientId, {
      name: name.trim(),
      nameLower,
      category,
      unit,
      calories: calories ?? 0,
      ...(replacements !== undefined ? { replacements } : {}),
      updatedAt: now,
    });

    return ingredientId;
  },
});

export const deleteIngredient = authMutation({
  args: { ingredientId: v.id("ingredients") },
  handler: async (ctx, { ingredientId }) => {
    return await ctx.db.delete(ingredientId);
  },
});
