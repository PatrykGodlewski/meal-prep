import { useEffect, useRef, useState, type RefObject } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { usePaginatedQuery } from "convex/react";
import { MEAL_CATEGORIES } from "@/convex/schema";
import { z } from "zod";

export const SEARCH_PARAM_KEY = "q";
export const FILTER_PARAM_KEY = "f";
const PAGE_SIZE = 10;

function useIntersection(
  ref: RefObject<HTMLDivElement | null>,
  options: IntersectionObserverInit = { rootMargin: "0px 0px 600px 0px" },
): boolean {
  const [isIntersecting, setIntersecting] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIntersecting(entry.isIntersecting),
      options,
    );

    const currentElement = ref.current;

    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [ref, options, options.root, options.rootMargin, options.threshold]);

  return isIntersecting;
}

type Props = {
  clientSearch?: string;
  categoryFilter?: (typeof MEAL_CATEGORIES)[number]; // Add the filter prop
};

const categorySchema = z.enum(MEAL_CATEGORIES);

export function usePaginatedMeals({
  clientSearch,
  categoryFilter,
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
  const isIntersecting = useIntersection(loadMoreRef);

  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) {
      loadMore(PAGE_SIZE);
    }
  }, [isIntersecting, hasNextPage, isFetchingNextPage, loadMore]);

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
