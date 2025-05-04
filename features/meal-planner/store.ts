"use client";
import { observable } from "@legendapp/state";
import { use$, useWhenReady } from "@legendapp/state/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { addDays, subDays, isToday } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { getMonday, getSaturday } from "./utils";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "@/convex/_generated/api";
import type { DateRange } from "react-day-picker";

type Store = {
  currentWeek: Date;
  shoppingListDate: DateRange | undefined;
  selectedPlanId: string | undefined;
};

const today = new Date();
const mealPlannerState$ = observable<Store>({
  currentWeek: getMonday(today),
  shoppingListDate: {
    from: getMonday(today),
    to: getSaturday(today),
  },
  selectedPlanId: undefined,
});

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

export const useMealPlanner = () => {
  const currentWeek = use$(mealPlannerState$.currentWeek);
  const selectedPlanId = use$(mealPlannerState$.selectedPlanId);

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
    convexQuery(api.shoppingList.getShoppingList, {
      startDate: use$(mealPlannerState$.shoppingListDate)?.from?.getTime(),
      endDate: use$(mealPlannerState$.shoppingListDate)?.to?.getTime(),
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

  useWhenReady(mealPlanData, (mealPlans) =>
    mealPlannerState$.selectedPlanId.set(
      mealPlans?.find((plan) => isToday(plan.date))?._id ??
        mealPlans?.find((plan) => plan.date === currentWeek.getTime())?._id,
    ),
  );

  return {
    mealPlannerState$,
    selectedPlanId, // Expose reactive selectedPlanId
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
