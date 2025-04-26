import { v } from "convex/values";
import { authQuery } from "../custom/query";
import { MEAL_CATEGORIES } from "../schema";
import { paginationOptsValidator } from "convex/server";

export const getMeals = authQuery({
  args: {
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
    filter: v.optional(v.union(...MEAL_CATEGORIES.map((c) => v.literal(c)))),
  },
  handler: async (ctx, { paginationOpts, search = "", filter }) => {
    const trimmedSearch = search.trim();
    const isSearching = !!trimmedSearch;
    const isFiltering = !!filter;

    if (isSearching) {
      const query = ctx.db
        .query("meals")
        .withSearchIndex("search_name", (q) => {
          if (isFiltering) {
            return q.search("name", trimmedSearch).eq("category", filter);
          }
          return q.search("name", trimmedSearch);
        });

      const results = await query.paginate(
        paginationOpts ?? { numItems: 10, cursor: null },
      );

      return results;
    }

    if (isFiltering) {
      const query = ctx.db
        .query("meals")
        .withIndex("by_category", (q) => q.eq("category", filter));

      const results = await query.paginate(
        paginationOpts ?? { numItems: 10, cursor: null },
      );

      return results;
    }

    const query = ctx.db.query("meals");

    const results = await query.paginate(
      paginationOpts ?? { numItems: 10, cursor: null },
    );

    return results;
  },
});

export const getMeal = authQuery({
  args: { mealId: v.id("meals") },
  handler: async (ctx, { mealId }) => {
    const meal = await ctx.db.get(mealId);

    if (!meal) {
      return null; // Return null if meal not found
    }

    // 2. Fetch associated mealIngredients
    const mealIngredients = await ctx.db
      .query("mealIngredients")
      .withIndex("by_meal", (q) => q.eq("mealId", mealId))
      .collect();

    // 3. Fetch the full ingredient details for each mealIngredient
    const detailedIngredients = await Promise.all(
      mealIngredients.map(async (mi) => {
        const ingredient = await ctx.db.get(mi.ingredientId);
        if (!ingredient) {
          // Handle case where ingredient might be missing (optional, log error, etc.)
          console.error(
            `Ingredient with ID ${mi.ingredientId} not found for meal ${mealId}`,
          );
          // Decide how to handle this: return null, skip, or throw?
          // Returning the mealIngredient without the full ingredient details for now.
          return { ...mi, ingredient: null };
        }
        // Combine mealIngredient info with the full ingredient object
        return { ...mi, ingredient };
      }),
    );

    // 4. Return the meal object augmented with detailed ingredients
    return {
      ...meal,
      mealIngredients: detailedIngredients, // Add the enriched ingredient list
    };
  },
});
