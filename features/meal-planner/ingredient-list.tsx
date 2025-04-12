// components/ingredient-list.tsx
"use client";

import { useState, useCallback } from "react";
import { Checkbox } from "@/components/ui/checkbox"; // Assuming shadcn/ui
import { Label } from "@/components/ui/label"; // Assuming shadcn/ui
import { cn } from "@/lib/utils"; // Assuming shadcn/ui utility

// --- Component Props and Types ---

interface IngredientListItem {
  ingredient: string; // Name of the ingredient (used as identifier)
  amount: string; // Formatted amount string (e.g., "2 cups", "1 pinch")
}

interface IngredientListProps {
  /** Array of ingredient items to display */
  ingredients: IngredientListItem[];
}

// --- IngredientList Component ---

/**
 * Displays a list of ingredients with amounts as a checkable list (like a shopping list).
 */
const IngredientList: React.FC<IngredientListProps> = ({ ingredients }) => {
  // State to track which ingredients (by name) are checked off
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  /**
   * Toggles the checked state for a given ingredient name.
   */
  const handleCheckChange = useCallback(
    (ingredientName: string, isChecked: boolean | "indeterminate") => {
      setCheckedItems((prevCheckedItems) => {
        const newCheckedItems = new Set(prevCheckedItems); // Create a new set for immutability
        if (isChecked) {
          newCheckedItems.add(ingredientName);
        } else {
          newCheckedItems.delete(ingredientName);
        }
        return newCheckedItems;
      });
    },
    [],
  ); // No dependencies needed as setCheckedItems is stable

  // Helper to determine if an item is checked
  const isChecked = (ingredientName: string): boolean => {
    return checkedItems.has(ingredientName);
  };

  // --- Render Logic ---

  if (!ingredients || ingredients.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 italic">
        No ingredients to display.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {ingredients.map((item) => {
        const checked = isChecked(item.ingredient);
        const uniqueId = `ingredient-${item.ingredient.replace(/\s+/g, "-")}`; // Create a more stable ID

        return (
          <li
            key={uniqueId} // Use the generated unique ID as the key
            className="flex items-center justify-between p-3 rounded-md border bg-white dark:bg-neutral-800/50 dark:border-neutral-700 shadow-sm hover:bg-gray-50 dark:hover:bg-neutral-700/50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Checkbox
                id={uniqueId}
                checked={checked}
                onCheckedChange={(checkedState) =>
                  handleCheckChange(item.ingredient, checkedState)
                }
                aria-labelledby={`${uniqueId}-label`} // Link checkbox to label for accessibility
              />
              <Label
                htmlFor={uniqueId}
                id={`${uniqueId}-label`}
                className={cn(
                  "text-sm font-medium cursor-pointer", // Add cursor-pointer to label
                  checked
                    ? "line-through text-gray-500 dark:text-gray-400"
                    : "text-gray-800 dark:text-gray-100",
                )}
              >
                {item.ingredient}
              </Label>
            </div>
            <span
              className={cn(
                "text-sm italic",
                checked
                  ? "text-gray-400 dark:text-gray-500"
                  : "text-gray-600 dark:text-gray-300",
              )}
            >
              {item.amount}
            </span>
          </li>
        );
      })}
    </ul>
  );
};

export default IngredientList;
