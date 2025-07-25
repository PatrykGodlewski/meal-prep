import { Skeleton } from "@/components/ui/skeleton";

/**
 * Renders a skeleton loading UI for the Add Meal page.
 * Mimics the structure of the AddMealForm component.
 */
export default function LoadingAddMeal() {
  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4 md:p-6">
      {/* Back Button Skeleton */}
      <Skeleton className="mb-4 h-10 w-24 rounded-md" />

      {/* Title Skeleton */}
      <Skeleton className="mb-6 h-8 w-48 rounded-md" />

      <div className="space-y-8">
        {/* Meal Name and Category Skeleton */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20 rounded-md" /> {/* Label */}
            <Skeleton className="h-10 w-full rounded-md" /> {/* Input */}
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 rounded-md" /> {/* Label */}
            <Skeleton className="h-10 w-full rounded-md" /> {/* Select */}
          </div>
        </div>

        {/* Description Skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-24 rounded-md" /> {/* Label */}
          <Skeleton className="h-20 w-full rounded-md" /> {/* Textarea */}
        </div>

        {/* Instructions Skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-28 rounded-md" /> {/* Label */}
          <Skeleton className="h-32 w-full rounded-md" /> {/* Textarea */}
          <Skeleton className="h-4 w-3/4 rounded-md" /> {/* Description */}
        </div>

        {/* Prep Time, Cook Time, Servings Skeleton */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 rounded-md" /> {/* Label */}
            <Skeleton className="h-10 w-full rounded-md" /> {/* Input */}
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 rounded-md" /> {/* Label */}
            <Skeleton className="h-10 w-full rounded-md" /> {/* Input */}
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20 rounded-md" /> {/* Label */}
            <Skeleton className="h-10 w-full rounded-md" /> {/* Input */}
          </div>
        </div>

        {/* Image URL Skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-24 rounded-md" /> {/* Label */}
          <Skeleton className="h-10 w-full rounded-md" /> {/* Input */}
          <Skeleton className="h-4 w-1/2 rounded-md" /> {/* Description */}
        </div>

        {/* Is Public Skeleton */}
        <div className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow-xs">
          <Skeleton className="h-5 w-5 rounded-sm" /> {/* Checkbox */}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32 rounded-md" /> {/* Label */}
            <Skeleton className="h-4 w-48 rounded-md" /> {/* Description */}
          </div>
        </div>

        {/* Ingredients Section Skeleton */}
        <div className="space-y-6 border-t pt-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-36 rounded-md" /> {/* Header */}
            <Skeleton className="h-9 w-32 rounded-md" /> {/* Add Button */}
          </div>

          {/* Ingredient Row Skeleton */}
          <div className="space-y-4">
            <div className="rounded-lg border bg-gray-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
              <div className="mb-3 flex items-center justify-between">
                <Skeleton className="h-5 w-24 rounded-md" /> {/* Label */}
                <Skeleton className="h-6 w-6 rounded-full" />{" "}
                {/* Remove Button */}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Ingredient Name */}
                <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                  <Skeleton className="h-3 w-16 rounded-md" /> {/* Label */}
                  <Skeleton className="h-10 w-full rounded-md" />{" "}
                  {/* Combobox */}
                </div>
                {/* Quantity */}
                <div className="space-y-1">
                  <Skeleton className="h-3 w-16 rounded-md" /> {/* Label */}
                  <Skeleton className="h-10 w-full rounded-md" /> {/* Input */}
                </div>
                {/* Unit */}
                <div className="space-y-1">
                  <Skeleton className="h-3 w-12 rounded-md" /> {/* Label */}
                  <Skeleton className="h-10 w-full rounded-md" />{" "}
                  {/* Select/Input */}
                </div>
                {/* Category */}
                <div className="space-y-1">
                  <Skeleton className="h-3 w-16 rounded-md" /> {/* Label */}
                  <Skeleton className="h-10 w-full rounded-md" />{" "}
                  {/* Select/Input */}
                </div>
                {/* Notes */}
                <div className="space-y-1">
                  <Skeleton className="h-3 w-12 rounded-md" /> {/* Label */}
                  <Skeleton className="h-10 w-full rounded-md" /> {/* Input */}
                </div>
                {/* Optional */}
                <div className="flex items-center space-x-2 pt-5">
                  <Skeleton className="h-5 w-5 rounded-sm" /> {/* Checkbox */}
                  <Skeleton className="h-4 w-16 rounded-md" /> {/* Label */}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button Skeleton */}
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    </div>
  );
}
