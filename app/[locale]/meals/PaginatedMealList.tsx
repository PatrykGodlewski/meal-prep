"use client";

import type React from "react";
import { For } from "@/components/for-each";
import { Skeleton } from "@/components/ui/skeleton";
import { usePaginatedMeals } from "@/hooks/use-paginated-meals";
import { MealCard } from "./MealCard";

// --- Skeleton Loader for Meal Card (Keep this presentation logic here) ---
const MealCardSkeleton = () => (
  <div className="flex h-full flex-col overflow-hidden rounded-lg bg-neutral-200 shadow-md dark:bg-neutral-700">
    <Skeleton className="h-48 w-full" />
    <div className="flex grow flex-col p-4">
      <Skeleton className="mb-2 h-6 w-3/4" />
      <Skeleton className="mb-1 h-4 w-full" />
      <Skeleton className="mb-4 h-4 w-5/6" />
      <div className="mb-3 flex items-center text-sm">
        <Skeleton className="mr-1 h-4 w-4 rounded-full" />
        <Skeleton className="mr-4 h-4 w-12" />
        <Skeleton className="mr-1 h-4 w-4 rounded-full" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="mt-auto flex items-center justify-between border-neutral-300 border-t pt-2 dark:border-neutral-600">
        <div className="flex items-center text-sm">
          <Skeleton className="mr-1 h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  </div>
);
// --- End Skeleton Loader ---

// Remove searchQuery prop if it's always derived from URL params via the hook
// interface PaginatedMealListProps {
//   searchQuery?: string; // This might no longer be needed
// }
// export const SEARCH_PARAM_KEY = "q"; // This is now defined in the hook

const PaginatedMealList: React.FC = () => {
  const {
    allMeals,
    status,
    isFetching, // Use this for the empty state check
    isFetchingNextPage,
    hasNextPage,
    loadMoreRef,
  } = usePaginatedMeals();

  if (status === "LoadingFirstPage") {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <MealCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <For
          each={allMeals}
          empty={
            !isFetching ? (
              <p className="col-span-full py-10 text-center text-neutral-500 dark:text-neutral-400">
                No meals found matching your criteria.
              </p>
            ) : null
          }
        >
          {(meal) => <MealCard key={meal._id} meal={meal} />}
        </For>
        {isFetchingNextPage &&
          Array.from({ length: 3 }).map((_, index) => (
            <MealCardSkeleton key={`loading-${index}`} />
          ))}
      </div>

      <div data-loader-ref ref={loadMoreRef} className="h-10" />

      <div className="mt-6 mb-4 flex h-10 items-center justify-center">
        {!isFetchingNextPage && hasNextPage && (
          <span className="text-neutral-500 dark:text-neutral-400">
            Scroll down to load more...
          </span>
        )}
        {!hasNextPage && allMeals.length > 0 && !isFetching && (
          <span className="text-neutral-500 dark:text-neutral-400">
            You've reached the end.
          </span>
        )}
      </div>
    </div>
  );
};

export default PaginatedMealList;
