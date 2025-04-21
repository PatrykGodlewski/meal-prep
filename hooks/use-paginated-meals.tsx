import { useEffect, useRef, useState, type RefObject } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { usePaginatedQuery } from "convex/react";

export const SEARCH_PARAM_KEY = "q";
const PAGE_SIZE = 10;

function useIntersection(
  ref: RefObject<HTMLDivElement | null>,
  options: IntersectionObserverInit = { rootMargin: "0px 0px 400px 0px" },
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

export function usePaginatedMeals() {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const search = searchParams.get(SEARCH_PARAM_KEY) ?? "";

  const { results, status, loadMore, isLoading } = usePaginatedQuery(
    api.meals.getMeals,
    { search },
    { initialNumItems: PAGE_SIZE },
  );

  console.log(results, status, search);

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
  };
}
