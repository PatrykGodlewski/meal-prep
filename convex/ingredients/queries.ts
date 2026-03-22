import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { authQuery } from "../custom/query";

export const getIngredientsPaginated = authQuery({
  args: {
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
  },
  handler: async (ctx, { paginationOpts, search = "" }) => {
    const trimmedSearch = search.trim();
    const pagination = paginationOpts ?? { numItems: 10, cursor: null };

    if (trimmedSearch) {
      const searchQ = ctx.db
        .query("ingredients")
        .withSearchIndex("search_name", (q) => q.search("name", trimmedSearch));
      return await searchQ.paginate(pagination);
    }

    return await ctx.db
      .query("ingredients")
      .withIndex("by_name")
      .paginate(pagination);
  },
});

export const findIngredientByName = authQuery({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    return await ctx.db
      .query("ingredients")
      .withIndex("by_name", (q) => q.eq("name", name))
      .first();
  },
});

export const getIngredients = authQuery({
  args: {},
  handler: async (ctx) => ctx.db.query("ingredients").collect(),
});

export const getIngredient = authQuery({
  args: { ingredientId: v.id("ingredients") },
  handler: async (ctx, { ingredientId }) => {
    const ingredient = await ctx.db.get(ingredientId);
    if (!ingredient) return null;

    const mealIngredients = await ctx.db
      .query("mealIngredients")
      .withIndex("by_ingredient", (q) => q.eq("ingredientId", ingredientId))
      .collect();

    const usedInMeals = await Promise.all(
      mealIngredients.map(async (mi) => {
        const meal = mi.mealId ? await ctx.db.get(mi.mealId) : null;
        return meal ? { meal, quantity: mi.quantity } : null;
      }),
    );

    const replacementEntries =
      ingredient.replacements ??
      (ingredient.replacementIds ?? []).map((id) => ({
        ingredientId: id,
        ratio: undefined,
      }));
    const replacementInfos = await Promise.all(
      replacementEntries.map(async (entry) => {
        const rep = await ctx.db.get(entry.ingredientId);
        return rep ? { name: rep.name, ratio: entry.ratio ?? 1 } : null;
      }),
    );
    const validReplacementInfos = replacementInfos.filter(
      (r): r is { name: string; ratio: number } => r !== null,
    );

    return {
      ...ingredient,
      replacementNames: validReplacementInfos.map((r) => r.name),
      replacementInfos: validReplacementInfos,
      usedInMeals: usedInMeals.filter(
        (m): m is NonNullable<typeof m> => m !== null,
      ),
    };
  },
});
