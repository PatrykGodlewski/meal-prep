import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react"; // Keep icons for structure

export default function PlannerLoading() {
  // Number of skeleton day cards to display
  const skeletonDayCount = 7;

  return (
    <div className="container mx-auto py-10">
      {/* Skeleton for Page Title */}
      <div className="flex items-center space-x-2 mb-6">
        <Skeleton className="h-7 w-7" /> {/* Icon Placeholder */}
        <Skeleton className="h-8 w-64" /> {/* Title Placeholder */}
      </div>

      {/* Skeleton for MealPlanGrid Component Wrapper */}
      <div className="p-4 space-y-6 border dark:border-neutral-800 rounded-lg bg-gray-50 dark:bg-neutral-900/30">
        {/* Skeleton for Planner Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 relative min-h-[200px]">
          {Array.from({ length: skeletonDayCount }).map((_, index) => (
            <div
              key={`skel-day-${index}`}
              className="border rounded-lg shadow-sm flex flex-col bg-white dark:bg-neutral-900 min-h-[150px]"
            >
              {/* Day Card Header Skeleton */}
              <div className="p-3 border-b dark:border-neutral-800">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-1/3" /> {/* Day Name */}
                  <Skeleton className="h-3 w-1/4" /> {/* Date */}
                </div>
              </div>
              {/* Day Card Content Skeleton */}
              <div className="p-3 space-y-3 flex-grow">
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
