import { Skeleton } from "@/components/ui/skeleton";

/**
 * Renders a skeleton loading UI for the meal plans page.
 * Mimics the structure of the actual page with placeholders.
 */
export default function LoadingPlans() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Skeleton */}
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-9 w-48 rounded-md" /> {/* Mimics h1 title */}
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Render multiple skeleton cards */}
        {[...Array(12)].map((_, index) => (
          <div
            key={index}
            // Apply similar styling as the actual card for consistent spacing/layout
            className="rounded-lg bg-white p-4 shadow-sm dark:bg-neutral-800"
          >
            {/* Card Content Skeleton */}
            <Skeleton className="mb-3 h-6 w-3/4 rounded-md" /> {/* Mimics h2 */}
            <Skeleton className="mb-2 h-9 w-24 rounded-md" />{" "}
            {/* Mimics Button */}
            <Skeleton className="mt-3 h-4 w-1/2 rounded-md" /> {/* Mimics p */}
          </div>
        ))}
      </div>
    </div>
  );
}
