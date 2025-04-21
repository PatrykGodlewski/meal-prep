"use client";
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Form } from "@/components/ui/form";
import { MealEditForm } from "@/features/meal-editor/meal-editor-form"; // Adjust path
import { MealDisplayDetails } from "@/features/meal-editor/meal-display-details"; // Adjust path
import { api } from "@/convex/_generated/api";
import { type Preloaded, usePreloadedQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation } from "@tanstack/react-query";
import { type MealUpdateFormValues } from "@/features/meal-editor/schema";
import { BackButton } from "@/components/back-button";
import { Button } from "@/components/ui/button";
import { Edit, X } from "lucide-react";

interface MealDetailViewProps {
  preloadedMeal: Preloaded<typeof api.meals.getMeal>;
  preloadedIngredients: Preloaded<typeof api.ingredients.getIngredients>;
}

// --- Helper Function ---
/**
 * Maps the fetched MealDetails data structure to the structure
 * required by the MealUpdateFormValues (Zod schema type).
 */

export default function MealDetailView({
  preloadedMeal,
  preloadedIngredients,
}: MealDetailViewProps) {
  const meal = usePreloadedQuery(preloadedMeal);
  const ingredientList = usePreloadedQuery(preloadedIngredients);

  const [isEditing, setIsEditing] = useState(false);

  const toggleEditMode = () => {
    setIsEditing((prev) => !prev);
  };

  if (!meal) {
    return <div> no meal </div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <BackButton />

        {isEditing ? (
          <Button variant="outline" onClick={toggleEditMode}>
            <X className="h-4 w-4 mr-1" /> Cancel
          </Button>
        ) : (
          <Button variant="outline" onClick={toggleEditMode}>
            <Edit className="h-4 w-4 mr-1" /> Edit Meal
          </Button>
        )}
      </div>

      {isEditing ? (
        <MealEditForm
          meal={meal}
          availableIngredients={ingredientList}
          onSuccess={() => setIsEditing(false)}
        />
      ) : (
        <MealDisplayDetails
          meal={meal} // Pass the whole meal object from pageData
          mealIngredients={meal.mealIngredients} // Pass the ingredients array
        />
      )}
    </div>
  );
}
