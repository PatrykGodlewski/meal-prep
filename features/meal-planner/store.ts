"use client";
import { observable } from "@legendapp/state";
import { use$ } from "@legendapp/state/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { addDays, subDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { getMonday } from "./utils";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@/convex/_generated/api";

export const MEAL_PLAN_QUERY_KEY_BASE = "meal-planner-QK";
export const SHOPPING_LIST_QUERY_KEY_BASE = "shopping-list-QK";

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
  const { toast } = useToast();

  const {
    data: mealPlanData,
    isLoading: isMealPlanLoading,
    error: mealPlanError,
  } = useQuery(
    convexQuery(api.mealPlans.getWeeklyMealPlan, {
      weekStart: currentWeek.getTime(),
    }),
  );

  const {
    data: shoppingListData,
    isLoading: isShoppingListLoading,
    error: shoppingListError,
  } = useQuery(
    convexQuery(api.shoppingList.getWeeklyShoppingList, {
      weekStart: currentWeek.getTime(),
    }),
  );

  const { mutate, isPending: isGenerating } = useMutation({
    mutationFn: useConvexMutation(api.planAndList.generatePlanAndShoppingList),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Meal plan generated and shopping list updated!",
      });
    },
    onError: (error) => {
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
    const weekStart = mealPlannerState$.currentWeek.get().getTime(); // Get current value directly
    mutate({ weekStart });
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
