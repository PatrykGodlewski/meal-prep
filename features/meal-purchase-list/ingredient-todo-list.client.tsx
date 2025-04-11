"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { Ingredient } from "@/supabase/schema";
import { useState } from "react";

interface IngredientItem {
  ingredient: Ingredient;
  amount: string;
}

interface IngredientListProps {
  ingredients: IngredientItem[];
}

const IngredientList: React.FC<IngredientListProps> = ({ ingredients }) => {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const handleCheck = (ingredientId: string) => {
    setCheckedItems((prevCheckedItems) => {
      const newCheckedItems = new Set(prevCheckedItems);
      if (newCheckedItems.has(ingredientId)) {
        newCheckedItems.delete(ingredientId);
      } else {
        newCheckedItems.add(ingredientId);
      }
      return newCheckedItems;
    });
  };

  const isChecked = (ingredientId: string): boolean => {
    return checkedItems.has(ingredientId);
  };

  return (
    <ul className="space-y-2">
      {ingredients.map((item) => (
        <li
          key={item.ingredient.id}
          className="flex items-center justify-between p-2 rounded-md shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center">
            <Checkbox
              id={`ingredient-${item.ingredient}`}
              checked={isChecked(item.ingredient.id)}
              onCheckedChange={() => handleCheck(item.ingredient.id)}
              className="mr-2"
            />
            <Label
              htmlFor={`ingredient-${item.ingredient}`}
              className={`text-sm ${
                isChecked(item.ingredient.id)
                  ? "line-through text-gray-500 dark:text-gray-400"
                  : "font-medium text-gray-700 dark:text-gray-200"
              }`}
            >
              {item.ingredient.name}
            </Label>
          </div>
          <span className="text-gray-500 text-sm italic">{item.amount}</span>
        </li>
      ))}
    </ul>
  );
};

export default IngredientList;
