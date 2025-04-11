// components/meal-display-details.tsx
import React from "react";
import Image from "next/image";
import { format } from "date-fns";
import { Clock, Users, ChefHat, Calendar, type LucideIcon } from "lucide-react";
// Import the necessary types, including the junction table type with nested ingredient
import type { Meal, MealIngredient, Ingredient } from "@/supabase/schema"; // Adjust path
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Type for the junction table data + nested ingredient details
// (Ensure this matches the type definition used in the parent server/client component)
export type MealIngredientWithDetails = MealIngredient & {
  ingredient: Ingredient | null; // Nested ingredient (can be null if join fails)
};

// Define the props expected by this display component
interface MealDisplayDetailsProps {
  meal: Meal;
  mealIngredientsData: MealIngredientWithDetails[];
  authorName: string;
}

// Helper component for meta labels
type MealLabelProps = {
  icon: LucideIcon;
  text: string | number | null | undefined; // Accept number for time/servings
};
function MealLabel({ icon: Icon, text }: MealLabelProps) {
  // Render nothing if text is null, undefined, or an empty string after trimming
  if (text === null || text === undefined || String(text).trim() === "")
    return null;
  return (
    <div className="flex items-center mr-4 mb-2 whitespace-nowrap text-sm">
      <Icon className="h-4 w-4 mr-1.5 flex-shrink-0" />
      <span>{text}</span>
    </div>
  );
}

export const MealDisplayDetails: React.FC<MealDisplayDetailsProps> = React.memo(
  ({ meal, mealIngredientsData, authorName }) => {
    const totalTime = (meal.prepTimeMinutes || 0) + (meal.cookTimeMinutes || 0);

    return (
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-md overflow-hidden">
        {/* Image Section */}
        <div className="relative h-64 md:h-96 w-full bg-gray-200 dark:bg-neutral-800">
          {meal.imageUrl ? (
            <Image
              src={meal.imageUrl}
              alt={meal.name}
              fill
              className="object-cover"
              priority
            /> // Added priority for potential LCP
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-neutral-700">
              <span className="text-gray-500 dark:text-neutral-400 text-lg">
                No image available
              </span>
            </div>
          )}
          {meal.category && (
            <span className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide">
              {meal.category}
            </span>
          )}
        </div>

        {/* Details Section */}
        <div className="p-6">
          {/* Title */}
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
            {meal.name}
          </h1>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center text-gray-600 dark:text-neutral-400 mb-6">
            <MealLabel icon={ChefHat} text={`By ${authorName}`} />
            <MealLabel
              icon={Calendar}
              text={format(new Date(meal.createdAt), "P")}
            />
            {totalTime > 0 && (
              <MealLabel icon={Clock} text={`${totalTime} min total`} />
            )}
            {meal.servings && (
              <MealLabel
                icon={Users}
                text={`${meal.servings} ${meal.servings === 1 ? "serving" : "servings"}`}
              />
            )}
          </div>

          {/* Description */}
          {meal.description && ( // Conditionally render description section
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">
                Description
              </h2>
              {/* Use dangerouslySetInnerHTML ONLY if description contains trusted HTML, otherwise render as text */}
              <p className="text-gray-700 dark:text-neutral-300 prose prose-sm dark:prose-invert max-w-none">
                {meal.description}
              </p>
            </div>
          )}

          {/* Ingredients & Instructions Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Ingredients Column */}
            <div className="lg:col-span-1">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                Ingredients
              </h2>
              {mealIngredientsData && mealIngredientsData.length > 0 ? (
                <ul className="space-y-2 text-sm text-gray-700 dark:text-neutral-300">
                  {/* Map over mealIngredientsData */}
                  {mealIngredientsData.map((mealIngredient) => {
                    // Gracefully handle if the nested ingredient is somehow null
                    if (!mealIngredient.ingredient) {
                      console.warn(
                        "Missing ingredient data for mealIngredient:",
                        mealIngredient,
                      );
                      return null; // Skip rendering this item
                    }
                    const ingredient = mealIngredient.ingredient; // Alias for readability
                    return (
                      <li
                        key={ingredient.id}
                        className="flex items-start gap-2"
                      >
                        {" "}
                        {/* Use ingredient.id as key */}
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mt-[7px] flex-shrink-0" />
                        <div>
                          {/* Display quantity (from junction) and unit/name (from ingredient) */}
                          <span className="font-medium">
                            {mealIngredient.quantity} {ingredient.unit}{" "}
                            {ingredient.name}
                          </span>
                          {/* Display category (from ingredient) */}
                          {ingredient.category && (
                            <span className="ml-2 text-xs text-gray-500 dark:text-neutral-400 capitalize">
                              ({ingredient.category.replace(/_/g, " ")})
                            </span>
                          )}
                          {/* Display optional/notes (from junction) */}
                          {mealIngredient.isOptional && (
                            <span className="ml-2 text-xs text-gray-500 dark:text-neutral-500">
                              (optional)
                            </span>
                          )}
                          {mealIngredient.notes && (
                            <p className="text-xs text-gray-600 dark:text-neutral-400 pl-0 mt-0.5">
                              {mealIngredient.notes}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 dark:text-neutral-500 italic">
                  No ingredients listed.
                </p>
              )}
            </div>

            {/* Instructions Column */}
            <div className="lg:col-span-2">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                Instructions
              </h2>
              <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-neutral-300">
                {meal.instructions ? (
                  meal.instructions
                    .split("\n")
                    .map(
                      (paragraph) =>
                        paragraph.trim() && <p className="mb-3">{paragraph}</p>,
                    )
                ) : (
                  <p className="text-gray-500 dark:text-neutral-500 italic">
                    No instructions provided.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);
MealDisplayDetails.displayName = "MealDisplayDetails";
