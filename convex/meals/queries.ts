import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { filter } from "convex-helpers/server/filter";
import { stream } from "convex-helpers/server/stream";
import { authQuery } from "../custom/query";
import schema from "../schema";
import { MEAL_CATEGORIES } from "../schema";

type CtxWithUser = QueryCtx & { user: { id: Id<"users"> } };

async function attachIsFavourited(
  ctx: CtxWithUser,
  page: Doc<"meals">[],
): Promise<(Doc<"meals"> & { isFavourited: boolean })[]> {
  if (page.length === 0) return [];
  const mealIdsOnPage = new Set(page.map((m) => m._id));
  const favouriteRows = await ctx.db
    .query("mealFavourites")
    .withIndex("by_user", (q) => q.eq("userId", ctx.user.id))
    .collect();
  const favouriteSet = new Set(
    favouriteRows.filter((r) => mealIdsOnPage.has(r.mealId)).map((r) => r.mealId),
  );
  return page.map((meal) => ({
    ...meal,
    isFavourited: favouriteSet.has(meal._id),
  }));
}

function parseOffsetCursor(cursor: string | null): number {
  if (!cursor) return 0;
  try {
    const decoded = JSON.parse(atob(cursor)) as { offset?: number };
    return typeof decoded?.offset === "number" ? Math.max(0, decoded.offset) : 0;
  } catch {
    return 0;
  }
}

function encodeOffsetCursor(offset: number): string {
  return btoa(JSON.stringify({ offset }));
}

/**
 * Get a paginated list of meals, with optional search, filtering, sort, and favourites-only.
 * When authenticated, each meal includes isFavourited for the current user.
 */
export const getMeals = authQuery({
  args: {
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
    filter: v.optional(v.union(...MEAL_CATEGORIES.map((c) => v.literal(c)))),
    sortBy: v.optional(v.union(v.literal("default"), v.literal("favourites"))),
    onlyFavourites: v.optional(v.boolean()),
  },
  handler: async (
    ctx,
    { paginationOpts, search = "", filter: categoryFilter, sortBy = "favourites", onlyFavourites = false },
  ) => {
    const trimmedSearch = search.trim();
    const isSearching = !!trimmedSearch;
    const isFiltering = !!categoryFilter;
    const sortByFavourites = sortBy === "favourites";
    const pagination = paginationOpts ?? { numItems: 10, cursor: null };

    type PaginatedMeals = { page: Doc<"meals">[]; status: string; isDone: boolean; continueCursor: string };
    let result: PaginatedMeals;

    // CASE 0: Only favourites – load user's favourites, filter, sort, paginate manually
    if (onlyFavourites) {
      const favouriteRows = await ctx.db
        .query("mealFavourites")
        .withIndex("by_user", (q) => q.eq("userId", ctx.user.id))
        .collect();
      const mealIds = favouriteRows.map((r) => r.mealId);
      const meals = (
        await Promise.all(mealIds.map((id) => ctx.db.get(id))))
        .filter((m): m is Doc<"meals"> => m !== null);

      let filtered = meals;
      if (isFiltering) {
        filtered = filtered.filter((m) => m.categories.includes(categoryFilter));
      }
      if (isSearching) {
        const lower = trimmedSearch.toLowerCase();
        filtered = filtered.filter((m) =>
          (m.searchContent ?? m.name ?? "").toLowerCase().includes(lower),
        );
      }
      if (sortByFavourites) {
        filtered = [...filtered].sort((a, b) => (b.favouriteCount ?? 0) - (a.favouriteCount ?? 0));
      }

      const offset = parseOffsetCursor(pagination.cursor);
      const page = filtered.slice(offset, offset + pagination.numItems);
      const hasMore = offset + pagination.numItems < filtered.length;
      const nextOffset = offset + pagination.numItems;

      const pageWithFavourites = page.map((m) => ({ ...m, isFavourited: true } as Doc<"meals"> & { isFavourited: boolean }));
      return {
        page: pageWithFavourites,
        status: hasMore ? "CanLoadMore" : "Exhausted",
        isDone: !hasMore,
        continueCursor: hasMore ? encodeOffsetCursor(nextOffset) : "",
      };
    }

    // CASE 1: Searching (with or without Filter)
    if (isSearching) {
      const searchQ = ctx.db
        .query("meals")
        .withSearchIndex("search_name", (q) =>
          q.search("searchContent", trimmedSearch),
        );

      if (isFiltering) {
        const expandedPagination = {
          ...pagination,
          numItems: Math.max(pagination.numItems * 5, 50),
        };
        result = (await filter(searchQ, (meal) =>
          meal.categories.includes(categoryFilter),
        ).paginate(expandedPagination)) as PaginatedMeals;
      } else {
        result = (await searchQ.paginate(pagination)) as PaginatedMeals;
      }
      if (sortByFavourites && result.page.length > 0) {
        result = {
          ...result,
          page: [...result.page].sort(
            (a, b) => (b.favouriteCount ?? 0) - (a.favouriteCount ?? 0),
          ),
        };
      }
    } else if (sortByFavourites) {
      const q = ctx.db
        .query("meals")
        .withIndex("by_favourite_count")
        .order("desc");
      if (isFiltering) {
        const expandedPagination = {
          ...pagination,
          numItems: Math.max(pagination.numItems * 5, 50),
        };
        result = (await filter(q, (meal) =>
          meal.categories.includes(categoryFilter),
        ).paginate(expandedPagination)) as PaginatedMeals;
        result = {
          ...result,
          page: result.page.slice(0, pagination.numItems),
        };
      } else {
        result = (await q.paginate(pagination)) as PaginatedMeals;
      }
    } else if (isFiltering) {
      const mealsStream = stream(ctx.db, schema)
        .query("meals")
        .filterWith(async (meal) => meal.categories.includes(categoryFilter));
      result = (await mealsStream.paginate({
        ...pagination,
        maximumRowsRead: 500,
      })) as PaginatedMeals;
    } else {
      result = (await ctx.db.query("meals").paginate(pagination)) as PaginatedMeals;
    }

    const pageWithFavourites = await attachIsFavourited(ctx, result.page);
    return { ...result, page: pageWithFavourites };
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
