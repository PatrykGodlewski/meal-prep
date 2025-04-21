"use client";

import type React from "react";
import { For } from "@/components/for-each";
import { Skeleton } from "@/components/ui/skeleton";
import { MealCard } from "./MealCard";
import { usePaginatedMeals } from "@/hooks/use-paginated-meals";

// --- Skeleton Loader for Meal Card (Keep this presentation logic here) ---
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

// Remove searchQuery prop if it's always derived from URL params via the hook
// interface PaginatedMealListProps {
//   searchQuery?: string; // This might no longer be needed
// }
// export const SEARCH_PARAM_KEY = "q"; // This is now defined in the hook

const PaginatedMealList: React.FC = () => {
  // Use the hook to get data and state
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <MealCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <For
          each={allMeals}
          empty={
            // Show empty message only when not initially fetching and no meals exist
            !isFetching && allMeals.length === 0 ? (
              <p className="col-span-full text-center py-10 text-neutral-500 dark:text-neutral-400">
                No meals found matching your criteria.
              </p>
            ) : null
          }
        >
          {(meal) => <MealCard key={meal._id} meal={meal} />}
        </For>
        {/* Show skeletons while fetching the next page */}
        {isFetchingNextPage &&
          Array.from({ length: 3 }).map((_, index) => (
            <MealCardSkeleton key={`loading-${index}`} />
          ))}
      </div>

      {/* Load More Trigger Element (Invisible) */}
      {/* Assign the ref obtained from the hook */}
      <div ref={loadMoreRef} className="h-10" />

      {/* Optional: Status indicator */}
      <div className="flex justify-center items-center mt-6 mb-4 h-10">
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
        {/* Optional: Show loading indicator even when not fetching next page but initial fetch is happening */}
        {/* {isFetching && !isFetchingNextPage && <p>Loading...</p>} */}
      </div>
    </div>
  );
};

export default PaginatedMealList;
