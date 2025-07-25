import { Skeleton } from "@/components/ui/skeleton";

export default function PlannerLoading() {
  // Number of skeleton day cards to display
  const skeletonDayCount = 7;

  return (
    <div className="container mx-auto py-10">
      {/* Skeleton for Page Title */}
      <div className="mb-6 flex items-center space-x-2">
        <Skeleton className="h-7 w-7" /> {/* Icon Placeholder */}
        <Skeleton className="h-8 w-64" /> {/* Title Placeholder */}
      </div>

      {/* Skeleton for MealPlanGrid Component Wrapper */}
      <div className="space-y-6 rounded-lg border bg-gray-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/30">
        {/* Skeleton for Planner Header */}
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          {/* Navigation Skeleton */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10" /> {/* Prev Button */}
            <Skeleton className="h-6 w-48" /> {/* Week Title */}
            <Skeleton className="h-10 w-10" /> {/* Next Button */}
          </div>
          {/* Generate Button Skeleton */}
          <Skeleton className="h-10 w-44" />
        </div>

        {/* Skeleton for Grid */}
        <div className="relative grid min-h-[200px] grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7">
          {Array.from({ length: skeletonDayCount }).map((_, index) => (
            <div
              key={`skel-day-${index}`}
              className="flex min-h-[150px] flex-col rounded-lg border bg-white shadow-xs dark:bg-neutral-900"
            >
              {/* Day Card Header Skeleton */}
              <div className="border-b p-3 dark:border-neutral-800">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-1/3" /> {/* Day Name */}
                  <Skeleton className="h-3 w-1/4" /> {/* Date */}
                </div>
              </div>
              {/* Day Card Content Skeleton */}
              <div className="grow space-y-3 p-3">
                {/* Simulate 2-3 meal entries */}
                <div className="space-y-1">
                  <Skeleton className="h-3 w-1/4" /> {/* Category */}
                  <Skeleton className="h-4 w-3/4" /> {/* Name */}
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-1/3" /> {/* Category */}
                  <Skeleton className="h-4 w-5/6" /> {/* Name */}
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-1/4" /> {/* Category */}
                  <Skeleton className="h-4 w-2/3" /> {/* Name */}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
