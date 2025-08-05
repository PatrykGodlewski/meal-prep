import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { filter } from "convex-helpers/server/filter";
import type { Doc } from "../_generated/dataModel";
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
    const isSearching = !!trimmedSearch;
    const isFiltering = !!categoryFilter;
    const { numItems = 10, cursor = null } = paginationOpts ?? {};

    if (!isSearching) {
      if (isFiltering) {
        return filter(ctx.db.query("meals"), (meal) =>
          categoryFilter ? !!meal.categories?.includes(categoryFilter) : true,
        ).paginate({ numItems, cursor });
      }
      return ctx.db.query("meals").paginate({ numItems, cursor });
    }

    const [mealsByName, matchingIngredients] = await Promise.all([
      filter(ctx.db.query("meals"), (meal) =>
        categoryFilter ? !!meal.categories?.includes(categoryFilter) : true,
      )
        .withSearchIndex("search_name", (q) => q.search("name", trimmedSearch))
        .collect(),

      ctx.db
        .query("ingredients")
        .withSearchIndex("search_name", (q) => q.search("name", trimmedSearch))
        .collect(),
    ]);

    let mealsByIngredient: Doc<"meals">[] = [];

    if (matchingIngredients.length > 0) {
      const ingredientIds = matchingIngredients.map((i) => i._id);

      const mealIngredientsResults = await Promise.all(
        ingredientIds.map((id) =>
          ctx.db
            .query("mealIngredients")
            .withIndex("by_ingredient", (q) => q.eq("ingredientId", id))
            .collect(),
        ),
      );

      const mealIngredients = mealIngredientsResults.flat();
      const mealIds = [...new Set(mealIngredients.map((mi) => mi.mealId))];

      if (mealIds.length > 0) {
        mealsByIngredient = (
          await Promise.all(mealIds.map((id) => ctx.db.get(id)))
        ).filter(Boolean) as Doc<"meals">[];

        if (isFiltering) {
          mealsByIngredient = mealsByIngredient.filter((meal) =>
            meal.categories?.includes(categoryFilter),
          );
        }
      }
    }

    const combinedResults = [
      ...mealsByName,
      ...mealsByIngredient.filter(
        (m) => !mealsByName.some((meal) => meal._id === m._id),
      ),
    ];

    let startIndex = 0;

    if (cursor) {
      startIndex = combinedResults.findIndex((m) => m._id === cursor) + 1;
      if (startIndex === 0) startIndex = 0;
    }

    const paginatedResults = combinedResults.slice(
      startIndex,
      startIndex + numItems,
    );

    const nextCursor =
      paginatedResults.length === numItems
        ? paginatedResults[paginatedResults.length - 1]._id
        : null;

    return {
      page: paginatedResults,
      isDone: !nextCursor,
      continueCursor: nextCursor,
    };
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
