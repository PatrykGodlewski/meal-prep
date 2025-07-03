"use client";

import { BackButton } from "@/components/back-button";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { api } from "@/convex/_generated/api";
import { MealDisplayDetails } from "@/features/meal-editor/meal-display-details";
import { MealEditForm } from "@/features/meal-editor/meal-editor-form";
import { type Preloaded, usePreloadedQuery } from "convex/react";
import { Edit, HelpCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

interface MealDetailViewProps {
  preloadedMeal: Preloaded<typeof api.meals.queries.getMeal>;
  preloadedIngredients: Preloaded<
    typeof api.ingredients.queries.getIngredients
  >;
}

export default function MealDetailView({
  preloadedMeal,
  preloadedIngredients,
}: MealDetailViewProps) {
  const meal = usePreloadedQuery(preloadedMeal);
  const ingredientList = usePreloadedQuery(preloadedIngredients);
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);

  const toggleEditMode = () => {
    setIsEditing((prev) => !prev);
  };

  useEffect(() => {
    if (!meal) {
      router.replace("/meals");
    }
  });

  if (!meal) {
    return <div> Meal not found </div>;
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
          <div className="flex gap-2">
            <ServingsTooltip />
            <Button variant="outline" onClick={toggleEditMode}>
              <Edit className="h-4 w-4 mr-1" /> Edit Meal
            </Button>
          </div>
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
          meal={meal}
          mealIngredients={meal?.mealIngredients}
        />
      )}
    </div>
  );
}

export function ServingsTooltip() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost">
            <HelpCircle />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-md max-w-md">
            Serving is a global setting that multiplies base values of meal.
            Meals should be composed in a way that all instructions are for most
            optimal meal preparation. Batch cooking or joining the factors of a
            meal in to other meal
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
