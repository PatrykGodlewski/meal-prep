import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Renders a skeleton loading UI for the meal plan detail page.
 * Mimics the structure of the actual page with placeholders.
 */
export default function LoadingPlanDetail() {
  return (
    <div className="container mx-auto space-y-4 py-8 px-4">
      {/* Back Button Skeleton */}
      <Skeleton className="h-10 w-24 rounded-md" /> {/* Mimics BackButton */}
      {/* Title Skeleton */}
      <Skeleton className="h-9 w-64 rounded-md" /> {/* Mimics h1 title */}
      {/* Meal Cards Skeleton Container */}
      <div className="flex flex-col gap-4">
        {/* Render multiple skeleton meal cards */}
        {[...Array(4)].map((_, index) => (
          <div
            key={index}
            // Mimic MealCard styling
            className="border p-4 rounded-md shadow-sm flex justify-between items-center"
          >
            {/* Left side: Meal Name and Category */}
            <div className="space-y-2">
              <Skeleton className="h-6 w-48 rounded-md" /> {/* Mimics h3 */}
              <Skeleton className="h-4 w-24 rounded-md" /> {/* Mimics p */}
            </div>
            {/* Right side: Select Trigger */}
            <Skeleton className="h-10 w-[280px] rounded-md" />{" "}
            {/* Mimics SelectTrigger */}
          </div>
        ))}
      </div>
    </div>
  );
}
