import { observable } from "@legendapp/state";
import { use$, useObservable } from "@legendapp/state/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, subDays } from "date-fns";
import { getMonday } from "./utils";
import {
  generatePlanAndUpdateShoppingList,
  getWeeklyMealPlan,
  getWeeklyShoppingList,
} from "./actions";
import { useToast } from "@/hooks/use-toast";
import {
  MEAL_PLAN_QUERY_KEY_BASE,
  SHOPPING_LIST_QUERY_KEY_BASE,
} from "./utils"; // Assuming utils exports these keys

// --- Observable State ---
// Using a global observable for the current week's start date
const mealPlannerState$ = observable({
  currentWeek: getMonday(new Date()),
});

// --- Actions ---
// Functions to modify the observable state
const setCurrentWeek = (date: Date) => {
  mealPlannerState$.currentWeek.set(getMonday(date));
};

const handleNavigatePrevious = () => {
  const currentMonday = getMonday(mealPlannerState$.currentWeek.get());
  const previousWeekStart = subDays(currentMonday, 7);
  mealPlannerState$.currentWeek.set(previousWeekStart);
};

const handleNavigateNext = () => {
  const currentMonday = getMonday(mealPlannerState$.currentWeek.get());
  const nextWeekStart = addDays(currentMonday, 7);
  mealPlannerState$.currentWeek.set(nextWeekStart);
};

// --- Custom Hook ---
// Combines state access, actions, and API mutation logic
export const useMealPlanner = () => {
  // const currentWeek = useObservable(mealPlannerState$.currentWeek);
  const currentWeek = use$(mealPlannerState$.currentWeek);

  // TanStack Query setup
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // --- Queries ---
  // Calculate the start of the current week and its ISO string representation for query keys
  const weekIsoString = currentWeek.toISOString();

  // Query Key for the current week's meal plan
  const mealPlanQueryKey = [MEAL_PLAN_QUERY_KEY_BASE, weekIsoString];

  // Query Key for the current week's shopping list
  const shoppingListQueryKey = [SHOPPING_LIST_QUERY_KEY_BASE, weekIsoString];

  // Fetch the meal plan for the current week
  const {
    data: mealPlanData,
    isLoading: isMealPlanLoading,
    error: mealPlanError,
  } = useQuery({
    queryKey: mealPlanQueryKey,
    queryFn: () => getWeeklyMealPlan(currentWeek), // Pass the Date object
    // Keep previous data while loading new week's data for smoother transitions
    placeholderData: (previousData) => previousData,
    // Consider staleness settings based on how often data might change outside generation
    // staleTime: 1000 * 60 * 5, // e.g., 5 minutes
  });

  // Fetch the shopping list for the current week
  const {
    data: shoppingListData,
    isLoading: isShoppingListLoading,
    error: shoppingListError,
  } = useQuery({
    queryKey: shoppingListQueryKey,
    queryFn: () => getWeeklyShoppingList(currentWeek), // Pass the Date object
    // Keep previous data while loading new week's data
    placeholderData: (previousData) => previousData,
    // staleTime: 1000 * 60 * 5, // e.g., 5 minutes
  });

  // --- Mutation ---
  const { mutate, isPending: isGenerating } = useMutation({
    mutationFn: async (weekStartDate: Date) => {
      // The actual server action call
      const result = await generatePlanAndUpdateShoppingList(weekStartDate);
      if (!result?.success) {
        // Throw an error if the server action indicates failure
        throw new Error(result?.error || "Failed to generate meal plan.");
      }
      return result; // Return the success result
    },
    onSuccess: (_, weekStartDate) => {
      // Invalidate queries for the specific week upon successful generation
      // Note: The query keys are now calculated above based on currentWeek,
      // but we still need the specific week's keys for invalidation here.
      const invalidatedWeekIsoString = getMonday(weekStartDate).toISOString();
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

      toast({
        title: "Success",
        description: "Meal plan generated and shopping list updated!",
      });
    },
    onError: (error) => {
      // Handle errors, e.g., show a toast notification
      console.error("Error generating meal plan:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    },
  });

  // Action to trigger the mutation using the current state
  const handleGenerateMealPlan = () => {
    const weekToGenerate = mealPlannerState$.currentWeek.get(); // Get current value directly
    mutate(weekToGenerate);
  };

  const isBusy = isMealPlanLoading || isShoppingListLoading;

  return {
    currentWeek, // The reactive state value
    setCurrentWeek, // Action to set the week
    handleNavigatePrevious, // Action for previous week
    handleNavigateNext, // Action for next week
    handleGenerateMealPlan, // Action to trigger generation
    isGenerating, // Loading state from the mutation
    isBusy,

    // Meal Plan Query Results
    mealPlanData,
    isMealPlanLoading,
    mealPlanError,

    // Shopping List Query Results
    shoppingListData,
    isShoppingListLoading,
    shoppingListError,
  };
};
