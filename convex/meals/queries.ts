import { filter } from "convex-helpers/server/filter";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { authQuery } from "../custom/query";
import { MEAL_CATEGORIES } from "../schema";

/**
 * Get a paginated list of meals, with optional search and filtering.
 *
 * @param {object} paginationOpts - The pagination options.
 * @param {string} [search] - The search query.
 * @param {string} [filter] - The category to filter by.
 * @returns {Promise<object>} A paginated list of meals.
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
    let query;

    if (trimmedSearch) {
      query = ctx.db
        .query("meals")
        .withSearchIndex("search_name", (q) => {
          let builder = q.search("name", trimmedSearch);
          if (categoryFilter) {
            builder = builder.eq("categories", [categoryFilter]);
          }
          return builder;
        });
    } else if (categoryFilter) {
      query = ctx.db
        .query("meals")
        .withIndex("by_categories", (q) =>
          q.eq("categories", [categoryFilter]),
        );
    } else {
      query = ctx.db.query("meals");
    }

    return await query.paginate(paginationOpts);
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

    const mealWithIngredients = {
      ...meal,
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
