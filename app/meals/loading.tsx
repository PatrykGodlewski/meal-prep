import { Skeleton } from "@/components/ui/skeleton";

export default function MealsLoading() {
  const skeletonCardCount = 6;

  return (
    <div className="container mx-auto py-10">
      {/* Skeleton for Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-7 w-7" /> {/* Icon Placeholder */}
          <Skeleton className="h-8 w-48" /> {/* Title Placeholder */}
        </div>
        <Skeleton className="h-10 w-32" /> {/* Button Placeholder */}
      </div>

      {/* Skeleton for Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: skeletonCardCount }).map((_, index) => (
          <div
            key={`skel-${index}`}
            className="bg-white dark:bg-neutral-900 rounded-lg overflow-hidden shadow-md border dark:border-neutral-800"
          >
            {/* Image Placeholder */}
            <Skeleton className="h-48 w-full" />

            {/* Content Placeholder */}
            <div className="p-4 space-y-3">
              <Skeleton className="h-6 w-3/4" /> {/* Title Placeholder */}
              <Skeleton className="h-4 w-full" /> {/* Description Line 1 */}
              <Skeleton className="h-4 w-5/6" /> {/* Description Line 2 */}
              <div className="flex justify-between items-center pt-2">
                <Skeleton className="h-4 w-1/3" /> {/* Meta Info Placeholder */}
                <Skeleton className="h-4 w-1/4" /> {/* Meta Info Placeholder */}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
