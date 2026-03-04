import { usePaginatedQuery } from "convex/react";
import { useSearchParams } from "next/navigation";
import { useRef } from "react";
import { z } from "zod";
import { api } from "@/convex/_generated/api";
import { MEAL_CATEGORIES } from "@/convex/schema";
import { useInfiniteScrollLoadMore } from "./use-infinite-scroll";

export const SEARCH_PARAM_KEY = "q";
export const FILTER_PARAM_KEY = "f";
const PAGE_SIZE = 10;

type Props = {
  clientSearch?: string;
  categoryFilter?: (typeof MEAL_CATEGORIES)[number];
  /** When false (e.g. modal closed), disables infinite scroll. Omit for page usage. */
  enabled?: boolean;
};

const categorySchema = z.enum(MEAL_CATEGORIES);

export function usePaginatedMeals({
  clientSearch,
  categoryFilter,
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

  const { results, status, loadMore, isLoading } = usePaginatedQuery(
    api.meals.queries.getMeals,
    { search, filter },
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
