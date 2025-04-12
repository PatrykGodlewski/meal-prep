"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { getAggregatedIngredients } from "./actions";
import IngredientList from "./ingredient-list";

// Type for the items expected by the IngredientList component
interface IngredientListItem {
  ingredient: string;
  amount: string; // Formatted amount string
}

// Type for the aggregated data structure returned by the server action
// interface AggregatedIngredient {
//   id: string;
//   name: string;
//   unit: string | null | undefined; // Match the type from the action
//   category: string | null | undefined; // Match the type from the action
//   totalNumericQuantity: number | null;
//   quantities: string[];
// }

interface AggregatedIngredientListProps {
  // Array of Meal IDs to fetch ingredients for
  mealIds: string[];
  // Optional: Title for the list
  title?: string;
}

// Query key base
const AGGREGATED_INGREDIENTS_QUERY_KEY = "aggregatedIngredients";

/**
 * Fetches and displays an aggregated, checkable list of ingredients
 * based on a provided list of Meal IDs.
 */
export const AggregatedIngredientList: React.FC<
  AggregatedIngredientListProps
> = ({
  mealIds,
  title = "Aggregated Shopping List", // Default title
}) => {
  // 1. Fetch Aggregated Ingredients using React Query
  const queryKey = useMemo(
    () => [AGGREGATED_INGREDIENTS_QUERY_KEY, mealIds.sort().join(",")],
    [mealIds],
  ); // Stable key based on sorted IDs

  const {
    data: queryResult, // Contains { success: boolean, ingredients?: AggregatedIngredient[], error?: string }
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: queryKey,
    queryFn: () => getAggregatedIngredients(mealIds), // Call server action
    enabled: mealIds.length > 0, // Only run if there are IDs
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // 2. Transform Aggregated Data for the IngredientList Component
  const shoppingListItems = useMemo((): IngredientListItem[] => {
    // Handle error or unsuccessful fetch from action
    if (!queryResult?.success || !queryResult.ingredients) {
      return [];
    }

    // Format the quantity/unit into the amount string
    return queryResult.ingredients.map((ing) => {
      let amountStr: string;
      // If numeric quantity exists and is not null, format it
      if (ing.totalNumericQuantity !== null) {
        // Basic formatting, adjust precision as needed
        amountStr = `${Number(ing.totalNumericQuantity.toFixed(2))}${ing.unit ? ` ${ing.unit}` : ""}`;
      } else {
        // Otherwise, join the original quantity strings (e.g., "1 pinch", "to taste")
        amountStr = ing.quantities.join(", ");
      }

      return {
        ingredient: ing.name,
        amount: amountStr,
      };
    });
  }, [queryResult]);

  // 3. Render based on state
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-4 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Loading ingredients...
        </div>
      );
    }

    if (isError) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return (
        <p className="text-sm text-red-600">
          Error loading ingredients: {errorMessage}
        </p>
      );
    }

    if (!queryResult?.success && queryResult?.error) {
      return <p className="text-sm text-red-600">Error: {queryResult.error}</p>;
    }

    if (shoppingListItems.length === 0) {
      return (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
          No ingredients found for the selected meals.
        </p>
      );
    }

    // Pass the formatted items to the checkable list component
    return <IngredientList ingredients={shoppingListItems} />;
  };

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-white dark:bg-neutral-800">
      <h3 className="text-lg font-semibold mb-3 border-b pb-2">{title}</h3>
      {renderContent()}
    </div>
  );
};
