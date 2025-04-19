"use client";

import type React from "react";
import { useEffect, useRef, useState, type RefObject } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getMealsWithQuery } from "../actions";
import { For } from "@/components/for-each";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import { MealCard } from "./MealCard";
import { useSearchParams } from "next/navigation";

// --- Basic Intersection Observer Hook ---
function useIntersection(
  ref: RefObject<HTMLDivElement | null>,
  options: IntersectionObserverInit = { rootMargin: "0px 0px 400px 0px" }, // Trigger 400px before element enters viewport
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    ref.current,
    options,
    options.root,
    options.rootMargin,
    options.threshold,
  ]);

  return isIntersecting;
}
// --- End Intersection Observer Hook ---

// --- Skeleton Loader for Meal Card ---
const MealCardSkeleton = () => (
  <div className="bg-neutral-200 dark:bg-neutral-700 rounded-lg overflow-hidden shadow-md h-full flex flex-col">
    <Skeleton className="h-48 w-full" />
    <div className="p-4 flex flex-col flex-grow">
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-5/6 mb-4" />
      <div className="flex items-center text-sm mb-3">
        <Skeleton className="h-4 w-4 mr-1 rounded-full" />
        <Skeleton className="h-4 w-12 mr-4" />
        <Skeleton className="h-4 w-4 mr-1 rounded-full" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="flex justify-between items-center mt-auto pt-2 border-t border-neutral-300 dark:border-neutral-600">
        <div className="flex items-center text-sm">
          <Skeleton className="h-4 w-4 mr-1 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  </div>
);
// --- End Skeleton Loader ---

interface PaginatedMealListProps {
  searchQuery?: string;
}

export const SEARCH_PARAM_KEY = "q";

const PaginatedMealList: React.FC<PaginatedMealListProps> = () => {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  const fetchMeals = async ({ pageParam = 1 }: { pageParam?: number }) => {
    const currentSearchQuery = searchParams.get(SEARCH_PARAM_KEY) || undefined;

    const result = await getMealsWithQuery(currentSearchQuery, pageParam);

    return result;
  };

  // Use the search param from the URL as part of the query key
  const currentSearchQuery = searchParams.get(SEARCH_PARAM_KEY) || "";

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    // Update queryKey to depend on the actual search term from URL
    queryKey: ["meals", currentSearchQuery],
    queryFn: fetchMeals,
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const totalFetchedMeals = allPages.reduce(
        (acc, page) => acc + page.meals.length,
        0,
      );
      const totalAvailableMeals = lastPage.totalCount;

      // If we've fetched less than the total available, there's potentially a next page
      if (totalFetchedMeals < totalAvailableMeals) {
        return allPages.length + 1; // Next page number
      }
      return undefined; // No more pages
    },
    // staleTime: 1000 * 60 * 1, // Optional: 1 minute stale time
  });

  const isIntersecting = useIntersection(loadMoreRef);

  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Handle initial loading state with skeletons
  if (status === "pending") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map(
          (
            _,
            index, // Show 6 skeletons initially
          ) => (
            <MealCardSkeleton key={index} />
          ),
        )}
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="text-center text-red-500 dark:text-red-400 py-10">
        Error loading meals: {error?.message || "Unknown error"}
      </div>
    );
  }

  const allMeals = data?.pages.flatMap((page) => page.meals) ?? [];

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <For
          each={allMeals}
          empty={
            !isFetching ? (
              <p className="col-span-full text-center py-10 text-neutral-500 dark:text-neutral-400">
                No meals found matching your criteria.
              </p>
            ) : null
          }
        >
          {(meal) => <MealCard key={meal.id} meal={meal} />}
        </For>
        {/* Show skeletons while fetching next page */}
        {isFetchingNextPage &&
          Array.from({ length: 3 }).map(
            (
              _,
              index, // Show 3 skeletons when loading more
            ) => <MealCardSkeleton key={`loading-${index}`} />,
          )}
      </div>

      {/* Load More Trigger Element (Invisible) */}
      <div ref={loadMoreRef} className="h-10" />

      {/* Optional: Explicit Load More Button or Status */}
      <div className="flex justify-center items-center mt-6 mb-4 h-10">
        {!isFetchingNextPage && hasNextPage && (
          <span className="text-neutral-500 dark:text-neutral-400">
            Scroll down to load more...
          </span>
          // Or a button:
          // <button
          //   onClick={() => fetchNextPage()}
          //   disabled={isFetchingNextPage}
          //   className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          // >
          //   {isFetchingNextPage ? 'Loading...' : 'Load More'}
          // </button>
        )}
        {!hasNextPage && allMeals.length > 0 && (
          <span className="text-neutral-500 dark:text-neutral-400">
            You've reached the end.
          </span>
        )}
      </div>
    </div>
  );
};

export default PaginatedMealList;
