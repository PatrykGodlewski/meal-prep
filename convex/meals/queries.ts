import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { filter } from "convex-helpers/server/filter";
import { stream } from "convex-helpers/server/stream";
import { authQuery } from "../custom/query";
import schema from "../schema";
import { MEAL_CATEGORIES } from "../schema";

/**
 * Get a paginated list of meals, with optional search and filtering.
 * Uses pre-filter pagination for category filter (stream + filterWith) so we get
 * the correct number of results instead of filtering after pagination.
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

      // If we also need to filter by category: convex-helpers filter applies
      // AFTER pagination (post-filter), so we request more items to compensate.
      if (isFiltering) {
        const expandedPagination = {
          ...pagination,
          numItems: Math.max(pagination.numItems * 5, 50),
        };
        return await filter(searchQ, (meal) =>
          meal.categories.includes(categoryFilter),
        ).paginate(expandedPagination);
      }

      return await searchQ.paginate(pagination);
    }

    // CASE 2: Filtering Only (No Text Search)
    // Use stream + filterWith for PRE-filter pagination - filter is applied
    // before picking the page, so we get the correct number of matching meals.
    if (isFiltering) {
      const mealsStream = stream(ctx.db, schema)
        .query("meals")
        .filterWith(async (meal) => meal.categories.includes(categoryFilter));
      return await mealsStream.paginate({
        ...pagination,
        maximumRowsRead: 500,
      });
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
          // Effective replacements: meal override or ingredient default
          const effectiveEntries =
            mi.allowedReplacements !== undefined
              ? mi.allowedReplacements
              : ingredient?.replacements ??
                (ingredient?.replacementIds ?? []).map((id) => ({
                  ingredientId: id,
                  ratio: undefined,
                }));
          const replacementInfos = await Promise.all(
            effectiveEntries.map(async (entry) => {
              const rep = await ctx.db.get(entry.ingredientId);
              return rep
                ? { name: rep.name, ratio: entry.ratio ?? 1 }
                : null;
            }),
          );
          const validReplacementInfos = replacementInfos.filter(
            (r): r is { name: string; ratio: number } => r !== null,
          );
          return {
            ...mi,
            ingredient,
            replacementNames: validReplacementInfos.map((r) => r.name),
            replacementInfos: validReplacementInfos,
          };
        }),
      ),
    };

    return mealWithIngredients;
  },
});
