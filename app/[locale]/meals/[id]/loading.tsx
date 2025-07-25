import { Skeleton } from "@/components/ui/skeleton";

// Helper component for meta labels skeleton
function MealLabelSkeleton() {
  return (
    <div className="mr-4 mb-2 flex items-center">
      <Skeleton className="mr-1.5 h-4 w-4 rounded-full" />
      <Skeleton className="h-4 w-20" />
    </div>
  );
}

export default function LoadingMealDetail() {
  return (
    <>
      {/* Top Bar Skeleton (Go Back Link & Action Buttons) */}
      <div className="mb-4 flex items-center justify-between">
        {/* Go Back Link Skeleton */}
        <Skeleton className="h-6 w-24" />

        {/* Action Buttons Skeleton */}
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20" /> {/* Edit Button Skeleton */}
          <Skeleton className="h-9 w-20" /> {/* Delete Button Skeleton */}
        </div>
      </div>

      <div className="animate-pulse overflow-hidden rounded-lg bg-white shadow-md dark:bg-neutral-900">
        {/* Image Skeleton */}
        <Skeleton className="relative h-64 w-full bg-gray-200 md:h-96 dark:bg-neutral-800" />

        {/* Details Section */}
        <div className="p-6">
          {/* Title Skeleton */}
          <Skeleton className="mb-2 h-8 w-3/4" />

          {/* Meta Info Skeleton */}
          <div className="mb-6 flex flex-wrap items-center text-gray-600 dark:text-neutral-400">
            <MealLabelSkeleton />
            <MealLabelSkeleton />
            <MealLabelSkeleton />
            <MealLabelSkeleton />
          </div>

          {/* Description Skeleton */}
          <div className="mb-8">
            <Skeleton className="mb-3 h-6 w-1/4" /> {/* Description Title */}
            <Skeleton className="mb-2 h-4 w-full" />
            <Skeleton className="mb-2 h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>

          {/* Ingredients & Instructions Grid Skeleton */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Ingredients Column Skeleton */}
            <div className="lg:col-span-1">
              <Skeleton className="mb-4 h-6 w-1/3" /> {/* Ingredients Title */}
              <ul className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Skeleton className="mt-[7px] inline-block h-1.5 w-1.5 shrink-0 rounded-full" />
                    <div className="w-full">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="mt-1 h-3 w-3/4" />{" "}
                      {/* Optional notes */}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Instructions Column Skeleton */}
            <div className="lg:col-span-2">
              <Skeleton className="mb-4 h-6 w-1/3" /> {/* Instructions Title */}
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="mt-4 h-4 w-full" />
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
