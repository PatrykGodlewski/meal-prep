import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { filter } from "convex-helpers/server/filter";
import { authQuery } from "../custom/query";
import { MEAL_CATEGORIES } from "../schema";

/**
 * Get a paginated list of meals, with optional search and filtering.
 */
export const getMeals = authQuery({
  args: {
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
    filter: v.optional(v.union(...MEAL_CATEGORIES.map((c) => v.literal(c)))),
  },
  handler: async (
    ctx,
    { paginationOpts, search = "", filter: categoryFilter },
  ) => {
    const trimmedSearch = search.trim();
    const isSearching = !!trimmedSearch;
    const isFiltering = !!categoryFilter;
    const pagination = paginationOpts ?? { numItems: 10, cursor: null };

    // CASE 1: Searching (with or without Filter)
    // We use the 'searchContent' field to find matches in Name OR Ingredients instantly.
    if (isSearching) {
      const searchQ = ctx.db
        .query("meals")
        .withSearchIndex("search_name", (q) => {
          // This searches the DENORMALIZED field (Name + Ingredients)
          return q.search("searchContent", trimmedSearch);
        });

      // If we also need to filter by category, we wrap the search query
      // with the filter helper. This avoids TypeScript 'any' errors.
      if (isFiltering) {
        return await filter(searchQ, (meal) =>
          meal.categories.includes(categoryFilter),
        ).paginate(pagination);
      }

      return await searchQ.paginate(pagination);
    }

    // CASE 2: Filtering Only (No Text Search)
    // We use the helper here to maintain type safety without casting to 'any'
    if (isFiltering) {
      return await filter(ctx.db.query("meals"), (meal) =>
        meal.categories.includes(categoryFilter),
      ).paginate(pagination);
    }

    // CASE 3: Fetch All
    return await ctx.db.query("meals").paginate(pagination);
  },
});

/**
 * Get a meal by its ID, along with its ingredients.
 *
 * @param {object} args - The arguments.
 * @param {string} args.mealId - The ID of the meal to fetch.
 * @returns {Promise<object|null>} The meal with its ingredients, or null if not found.
 */
export const getMeal = authQuery({
  args: { mealId: v.id("meals") },
  handler: async (ctx, { mealId }) => {
    const meal = await ctx.db.get(mealId);
    if (!meal) return null;

    const mealIngredients = await ctx.db
      .query("mealIngredients")
      .withIndex("by_meal", (q) => q.eq("mealId", mealId))
      .collect();

    const author = meal.createdBy
      ? await ctx.db.get(meal.createdBy)
      : null;
    const authorDisplayName = author
      ? author.name ?? author.email ?? "Unknown"
      : "Unknown";

    const mealWithIngredients = {
      ...meal,
      authorDisplayName,
      mealIngredients: await Promise.all(
        mealIngredients.map(async (mi) => {
          const ingredient = mi.ingredientId
            ? await ctx.db.get(mi.ingredientId)
            : null;
          return { ...mi, ingredient };
        }),
      ),
    };

    return mealWithIngredients;
  },
});
