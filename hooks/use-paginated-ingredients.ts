import { usePaginatedQuery } from "convex/react";
import { useSearchParams } from "next/navigation";
import { useRef } from "react";
import { api } from "@/convex/_generated/api";
import { useInfiniteScrollLoadMore } from "./use-infinite-scroll";

export const SEARCH_PARAM_KEY = "q";
const PAGE_SIZE = 12;

type Props = {
  clientSearch?: string;
};

export function usePaginatedIngredients({ clientSearch }: Props = {}) {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  const search = clientSearch
    ? clientSearch
    : (searchParams.get(SEARCH_PARAM_KEY) ?? "");

  const { results, status, loadMore, isLoading } = usePaginatedQuery(
    api.ingredients.queries.getIngredientsPaginated,
    { search },
    { initialNumItems: PAGE_SIZE },
  );

  const hasNextPage = status === "CanLoadMore";
  const isFetchingNextPage = status === "LoadingMore";
  const sentinelVisible = status !== "LoadingFirstPage";

  useInfiniteScrollLoadMore({
    loadMoreRef,
    loadMore,
    hasNextPage,
    isFetchingNextPage,
    pageSize: PAGE_SIZE,
    enabled: sentinelVisible,
  });

  const allIngredients = results ?? [];

  return {
    allIngredients,
    status,
    isFetching: isLoading,
    isFetchingNextPage,
    hasNextPage,
    loadMoreRef,
    loadMore,
  };
}
