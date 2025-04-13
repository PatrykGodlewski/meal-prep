"use client";

import { useState, useMemo, useCallback } from "react";
import { format, addDays, subDays, isValid } from "date-fns";
import {
  useQueryClient,
  keepPreviousData,
  useQueries,
} from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getMonday,
  createBaseWeekStructure,
  mergeDataWithBaseStructure,
  DATE_FORMAT_DISPLAY_HEADER,
  MEAL_PLAN_QUERY_KEY_BASE,
  SHOPPING_LIST_QUERY_KEY_BASE,
} from "@/features/meal-planner/utils";
import { DayCard } from "./day-card";
import {
  generateWeeklyMealPlan,
  getWeeklyMealPlan,
  getWeeklyShoppingList,
  type WeeklyShoppingList,
} from "./actions";
import type { MealPlanClient } from "./types";
import { ShoppingListDisplay } from "./purchase-list.client";

interface Props {
  initialMealPlansData: MealPlanClient[] | undefined;
  initialShoppingList: WeeklyShoppingList | null;
}

export function MealPlanGrid({
  initialMealPlansData,
  initialShoppingList,
}: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const initialStartDate = useMemo(() => {
    const parsedInitial = initialMealPlansData;
    return parsedInitial && parsedInitial.length > 0
      ? getMonday(parsedInitial[0].date)
      : getMonday(new Date());
  }, [initialMealPlansData]);

  const [displayedWeekStart, setDisplayedWeekStart] =
    useState<Date>(initialStartDate);
  const [isGenerating, setIsGenerating] = useState(false);

  const mealPlanQueryKey = useMemo(
    () => [MEAL_PLAN_QUERY_KEY_BASE, displayedWeekStart.toISOString()],
    [displayedWeekStart],
  );

  const shoppingListQueryKey = useMemo(
    () => [SHOPPING_LIST_QUERY_KEY_BASE, displayedWeekStart.toISOString()],
    [displayedWeekStart],
  );

  const [
    {
      data: mealPlanData,
      isFetching: isFetchingMealPlan,
      isError: isErrorMealPlan,
      error: mealPlanError,
      isPlaceholderData: isPlaceholderDataMealPlan,
    },
    {
      data: shoppingListData,
      isFetching: isFetchingShoppingList,
      isError: isErrorShoppingList,
      error: shoppingListError,
      isPlaceholderData: isPlaceholderDataShoppingList,
    },
  ] = useQueries({
    queries: [
      {
        queryKey: mealPlanQueryKey,
        queryFn: () => getWeeklyMealPlan(displayedWeekStart),
        staleTime: 1000 * 60 * 5,
        placeholderData: keepPreviousData,
        enabled: isValid(displayedWeekStart),
        initialData: () => {
          if (
            displayedWeekStart.toISOString() === initialStartDate.toISOString()
          ) {
            return initialMealPlansData;
          }
          return undefined;
        },
      },
      {
        queryKey: shoppingListQueryKey,
        queryFn: () => getWeeklyShoppingList(displayedWeekStart),
        placeholderData: keepPreviousData,
        enabled: isValid(displayedWeekStart),
        initialData: initialShoppingList,
      },
    ],
  });

  const displayPlan = useMemo(() => {
    const baseStructure = createBaseWeekStructure(displayedWeekStart);
    return mergeDataWithBaseStructure(baseStructure, mealPlanData); // Use mealPlanData here
  }, [mealPlanData, displayedWeekStart]);

  const handleNavigateWeek = useCallback((direction: "previous" | "next") => {
    setDisplayedWeekStart((prevWeekStart) => {
      const currentMonday = getMonday(prevWeekStart);
      return direction === "previous"
        ? subDays(currentMonday, 7)
        : addDays(currentMonday, 7);
    });
  }, []);

  const handleGenerateMeals = useCallback(async () => {
    setIsGenerating(true);
    const mondayForGeneration = getMonday(displayedWeekStart);
    const generationQueryKey = [
      MEAL_PLAN_QUERY_KEY_BASE,
      mondayForGeneration.toISOString(),
    ];
    try {
      await generateWeeklyMealPlan(mondayForGeneration);
      toast({
        title: "Success",
        description: "Meal plan generation initiated!",
      });
      await queryClient.invalidateQueries({ queryKey: generationQueryKey });
    } catch (err) {
      console.error("Error generating meal plan:", err);
      const error =
        err instanceof Error ? err : new Error("Failed to generate plan.");
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [queryClient, toast, displayedWeekStart]);

  // isBusy includes generating state OR when fetching new data (not placeholder)
  const isBusy =
    isGenerating || (isFetchingMealPlan && !isPlaceholderDataMealPlan); //Use MealPlan Fetching state
  // Show overlay only when fetching new data and showing placeholder
  const showLoadingOverlay = isFetchingMealPlan && isPlaceholderDataMealPlan; //Use MealPlan Fetching state

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleNavigateWeek("previous")}
            disabled={isBusy}
            aria-label="Previous Week"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold text-center sm:text-left whitespace-nowrap tabular-nums">
            Week of{" "}
            {isValid(displayedWeekStart)
              ? format(displayedWeekStart, DATE_FORMAT_DISPLAY_HEADER)
              : "Loading..."}
          </h2>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleNavigateWeek("next")}
            disabled={isBusy}
            aria-label="Next Week"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button onClick={handleGenerateMeals} disabled={isBusy}>
          {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Generate for This Week
        </Button>
      </div>

      <div
        key={displayedWeekStart.toISOString()}
        className={
          "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 relative min-h-[200px]"
        }
      >
        {showLoadingOverlay && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-black/50 z-10 rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {isErrorMealPlan &&
          !isFetchingMealPlan && ( // Use isErrorMealPlan here
            <div className="col-span-full text-center text-red-500 mt-8">
              Error loading meal plan:{" "}
              {mealPlanError instanceof Error
                ? mealPlanError.message
                : "Unknown error"}{" "}
            </div>
          )}

        {!isErrorMealPlan && // Use isErrorMealPlan here
          displayPlan.map((planDay) => (
            <DayCard
              key={planDay.date.toISOString()}
              planDay={planDay}
              isLoading={showLoadingOverlay}
            />
          ))}
      </div>
      <ShoppingListDisplay
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        list={shoppingListData!}
        currentWeek={displayedWeekStart}
      />
    </div>
  );
}
