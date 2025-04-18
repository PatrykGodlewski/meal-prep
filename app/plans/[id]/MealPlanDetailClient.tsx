"use client";
import type { Meal } from "@/supabase/schema";
import type { MealPlanDetails } from "./page";
import { For } from "@/components/for-each";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { changeMeal } from "./actions"; // Import the server action
import { useEffect } from "react";
import { getMonday } from "@/features/meal-planner/utils";
import {
  MEAL_PLAN_QUERY_KEY_BASE,
  SHOPPING_LIST_QUERY_KEY_BASE,
} from "@/features/meal-planner/store";
import { useQueryClient } from "@tanstack/react-query";
import { toDate } from "date-fns";

interface Props {
  initialPlanData: MealPlanDetails;
  allMeals: Meal[];
}
export function MealPlanDetailClient({ allMeals, initialPlanData }: Props) {
  const queryClient = useQueryClient();
  useEffect(() => {
    const invalidatedWeekIsoString = getMonday(
      toDate(initialPlanData.date),
    ).toISOString();
    const invalidatedMealPlanQueryKey = [
      MEAL_PLAN_QUERY_KEY_BASE,
      invalidatedWeekIsoString,
    ];
    const invalidatedShoppingListQueryKey = [
      SHOPPING_LIST_QUERY_KEY_BASE,
      invalidatedWeekIsoString,
    ];

    // Invalidate both meal plan and shopping list queries for the affected week
    queryClient.invalidateQueries({ queryKey: invalidatedMealPlanQueryKey });
    queryClient.invalidateQueries({
      queryKey: invalidatedShoppingListQueryKey,
    });
  });
  return (
    <div className="flex flex-col gap-4">
      <For
        each={initialPlanData.plannedMeals.sort((a, b) =>
          (a.meal.category ?? "").localeCompare(b.meal?.category ?? ""),
        )}
      >
        {(plannedMeal) => (
          <MealCard
            key={plannedMeal.id} // Add key for list rendering
            plannedMeal={plannedMeal}
            allMeals={allMeals} // Pass allMeals down
          />
        )}
      </For>
    </div>
  );
}

interface MealCardProps {
  plannedMeal: MealPlanDetails["plannedMeals"][number];
  allMeals: Meal[]; // Add allMeals prop
}

function MealCard({ plannedMeal, allMeals }: MealCardProps) {
  // Handler for when a new meal is selected
  const handleMealChange = (newMealId: string) => {
    // Call the server action
    // Consider adding optimistic updates or loading states here
    changeMeal(plannedMeal.id, newMealId)
      .then(() => {
        // Optional: Show success feedback
        console.log("Meal changed successfully");
      })
      .catch((error) => {
        // Optional: Show error feedback
        console.error("Failed to change meal:", error);
        // Potentially revert optimistic update here
      });
  };

  return (
    <div className="border p-4 rounded-md shadow flex justify-between items-center">
      <div>
        <h3 className="font-semibold text-lg">{plannedMeal.meal.name}</h3>
        <p className="text-sm text-gray-600">{plannedMeal.meal.category}</p>
        {/* Add more meal details if needed */}
      </div>
      <Select
        defaultValue={plannedMeal.mealId} // Set initial value to current meal ID
        onValueChange={handleMealChange} // Call action on change
      >
        <SelectTrigger className="w-[280px]">
          <SelectValue placeholder="Change meal..." />
        </SelectTrigger>
        <SelectContent>
          <For
            each={allMeals.filter(
              (meal) => meal.category === plannedMeal.meal.category,
            )}
          >
            {(mealOption) => (
              <SelectItem key={mealOption.id} value={mealOption.id}>
                {mealOption.name.trim()}
              </SelectItem>
            )}
          </For>
        </SelectContent>
      </Select>
    </div>
  );
}
