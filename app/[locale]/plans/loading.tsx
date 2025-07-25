import { Skeleton } from "@/components/ui/skeleton";

/**
 * Renders a skeleton loading UI for the meal plans page.
 * Mimics the structure of the actual page with placeholders.
 */
export default function LoadingPlans() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-9 w-48 rounded-md" /> {/* Mimics h1 title */}
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Render multiple skeleton cards */}
        {[...Array(12)].map((_, index) => (
          <div
            key={index}
            // Apply similar styling as the actual card for consistent spacing/layout
            className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm p-4"
          >
            {/* Card Content Skeleton */}
            <Skeleton className="h-6 w-3/4 mb-3 rounded-md" /> {/* Mimics h2 */}
            <Skeleton className="h-9 w-24 mb-2 rounded-md" />{" "}
            {/* Mimics Button */}
            <Skeleton className="h-4 w-1/2 mt-3 rounded-md" /> {/* Mimics p */}
          </div>
        ))}
      </div>
    </div>
  );
}
