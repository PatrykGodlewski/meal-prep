import { usePaginatedQuery } from "convex/react";
import { useSearchParams } from "next/navigation";
import { useRef } from "react";
import { z } from "zod";
import { api } from "@/convex/_generated/api";
import { MEAL_CATEGORIES } from "@/convex/schema";
import { useInfiniteScrollLoadMore } from "./use-infinite-scroll";

export const SEARCH_PARAM_KEY = "q";
export const FILTER_PARAM_KEY = "f";
export const SORT_PARAM_KEY = "sort";
export const FAV_PARAM_KEY = "fav";
const PAGE_SIZE = 10;

export type MealsSortBy = "default" | "favourites";

type Props = {
  clientSearch?: string;
  categoryFilter?: (typeof MEAL_CATEGORIES)[number];
  /** Sort order: default (no sort) or favourites (most favourited first). */
  sortBy?: MealsSortBy;
  /** Show only the user's favourited meals. */
  onlyFavourites?: boolean;
  /** When false (e.g. modal closed), disables infinite scroll. Omit for page usage. */
  enabled?: boolean;
};

const categorySchema = z.enum(MEAL_CATEGORIES);

const sortSchema = z.enum(["default", "favourites"]);

export function usePaginatedMeals({
  clientSearch,
  categoryFilter,
  sortBy: sortByProp,
  onlyFavourites: onlyFavouritesProp,
  enabled: enabledProp,
}: Props = {}) {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  const search = clientSearch
    ? clientSearch
    : (searchParams.get(SEARCH_PARAM_KEY) ?? "");

  const filter = categoryFilter
    ? categoryFilter
    : categorySchema.safeParse(searchParams.get(FILTER_PARAM_KEY)).data;

  const sortBy =
    sortByProp ??
    (sortSchema.safeParse(searchParams.get(SORT_PARAM_KEY)).data ?? "favourites");

  const onlyFavourites =
    onlyFavouritesProp ??
    (searchParams.get(FAV_PARAM_KEY) === "1");

  const { results, status, loadMore, isLoading } = usePaginatedQuery(
    api.meals.queries.getMeals,
    { search, filter, sortBy, onlyFavourites },
    { initialNumItems: PAGE_SIZE },
  );

  const hasNextPage = status === "CanLoadMore";
  const isFetchingNextPage = status === "LoadingMore";
  const sentinelVisible = status !== "LoadingFirstPage";
  const enabled = (enabledProp ?? true) && sentinelVisible;

  useInfiniteScrollLoadMore({
    loadMoreRef,
    loadMore,
    hasNextPage,
    isFetchingNextPage,
    pageSize: PAGE_SIZE,
    enabled,
  });

  const allMeals = results ?? [];

  return {
    allMeals,
    status,
    isFetching: isLoading,
    isFetchingNextPage,
    hasNextPage,
    loadMoreRef,
    loadMore,
  };
}
