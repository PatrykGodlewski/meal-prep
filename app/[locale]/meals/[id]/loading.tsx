import { Calendar, ChefHat, Clock, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Helper component for meta labels skeleton
function MealLabelSkeleton() {
  return (
    <div className="flex items-center mr-4 mb-2">
      <Skeleton className="h-4 w-4 mr-1.5 rounded-full" />
      <Skeleton className="h-4 w-20" />
    </div>
  );
}

export default function LoadingMealDetail() {
  return (
    <>
      {/* Top Bar Skeleton (Go Back Link & Action Buttons) */}
      <div className="flex justify-between items-center mb-4">
        {/* Go Back Link Skeleton */}
        <Skeleton className="h-6 w-24" />

        {/* Action Buttons Skeleton */}
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20" /> {/* Edit Button Skeleton */}
          <Skeleton className="h-9 w-20" /> {/* Delete Button Skeleton */}
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-md overflow-hidden animate-pulse">
        {/* Image Skeleton */}
        <Skeleton className="relative h-64 md:h-96 w-full bg-gray-200 dark:bg-neutral-800" />

        {/* Details Section */}
        <div className="p-6">
          {/* Title Skeleton */}
          <Skeleton className="h-8 w-3/4 mb-2" />

          {/* Meta Info Skeleton */}
          <div className="flex flex-wrap items-center text-gray-600 dark:text-neutral-400 mb-6">
            <MealLabelSkeleton />
            <MealLabelSkeleton />
            <MealLabelSkeleton />
            <MealLabelSkeleton />
          </div>

          {/* Description Skeleton */}
          <div className="mb-8">
            <Skeleton className="h-6 w-1/4 mb-3" /> {/* Description Title */}
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6" />
          </div>

          {/* Ingredients & Instructions Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Ingredients Column Skeleton */}
            <div className="lg:col-span-1">
              <Skeleton className="h-6 w-1/3 mb-4" /> {/* Ingredients Title */}
              <ul className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Skeleton className="inline-block w-1.5 h-1.5 rounded-full mt-[7px] shrink-0" />
                    <div className="w-full">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-3/4 mt-1" />{" "}
                      {/* Optional notes */}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Instructions Column Skeleton */}
            <div className="lg:col-span-2">
              <Skeleton className="h-6 w-1/3 mb-4" /> {/* Instructions Title */}
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full mt-4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
