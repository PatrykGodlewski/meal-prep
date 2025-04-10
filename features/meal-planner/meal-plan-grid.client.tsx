"use client";

import React, { useState, useMemo, useCallback } from "react";
import { format, addDays, subDays, isValid } from "date-fns";
import {
  useQuery,
  useQueryClient,
  keepPreviousData, // Import keepPreviousData placeholder
} from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import {
  generateWeeklyMealPlan,
  getMealPlansDataForCurrentWeek,
} from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import {
  type MealPlanDayInternal,
  type WeeklyPlanClientInput,
} from "@/validators/mealPlanner";
import {
  getMonday,
  parseValidDaysFromWeekData,
  createBaseWeekStructure,
  mergeDataWithBaseStructure,
  DATE_FORMAT_DISPLAY_HEADER,
  MEAL_PLAN_QUERY_KEY_BASE,
} from "@/features/meal-planner/utils"; // Adjust path
import { DayCard } from "./day-card";

interface MealPlanGridProps {
  initialMealPlansData: WeeklyPlanClientInput | null | undefined;
}

const MealPlanGrid: React.FC<MealPlanGridProps> = ({
  initialMealPlansData,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const initialStartDate = useMemo(() => {
    const parsedInitial = parseValidDaysFromWeekData(initialMealPlansData);
    return parsedInitial.length > 0
      ? getMonday(parsedInitial[0].date)
      : getMonday(new Date());
  }, [initialMealPlansData]);

  const [displayedWeekStart, setDisplayedWeekStart] =
    useState<Date>(initialStartDate);
  const [isGenerating, setIsGenerating] = useState(false);

  const queryKey = useMemo(
    () => [MEAL_PLAN_QUERY_KEY_BASE, displayedWeekStart.toISOString()],
    [displayedWeekStart],
  );

  const {
    data: currentWeekParsedData,
    isFetching,
    isError,
    error,
    isPlaceholderData, // Use this instead of manually tracking navigation loading
  } = useQuery<WeeklyPlanClientInput | null, Error, MealPlanDayInternal[]>({
    queryKey: queryKey,
    queryFn: () => getMealPlansDataForCurrentWeek(),
    select: parseValidDaysFromWeekData,
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: keepPreviousData, // Correct way to use keepPreviousData in v5+
    enabled: isValid(displayedWeekStart),
    initialData: () => {
      // Provide initial data only if it matches the initial query key
      if (displayedWeekStart.toISOString() === initialStartDate.toISOString()) {
        return initialMealPlansData;
      }
      // Return undefined, not null, if not providing initial data
      return undefined;
    },
    // initialDataUpdatedAt is usually needed when initialData is NOT a function
    // If initialData is a function, RQ handles staleness based on when it runs.
    // If issues persist, uncomment and provide a timestamp:
    // initialDataUpdatedAt: initialMealPlansData ? Date.now() : undefined,
  });

  const displayPlan = useMemo(() => {
    const baseStructure = createBaseWeekStructure(displayedWeekStart);
    // Use currentWeekParsedData which comes from the query (includes selected/parsed data)
    return mergeDataWithBaseStructure(baseStructure, currentWeekParsedData);
  }, [currentWeekParsedData, displayedWeekStart]);

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
    const mondayForGeneration = getMonday(new Date());
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
  }, [queryClient, toast]);

  // isBusy includes generating state OR when fetching new data (not placeholder)
  const isBusy = isGenerating || (isFetching && !isPlaceholderData);
  // Show overlay only when fetching new data and showing placeholder
  const showLoadingOverlay = isFetching && isPlaceholderData;

  return (
    <div className="p-4">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleNavigateWeek("previous")}
            disabled={isBusy} // Disable if generating or actively fetching new data
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
        className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 relative min-h-[200px]`}
      >
        {showLoadingOverlay && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-black/50 z-10 rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {isError &&
          !isFetching && ( // Show error only if not currently fetching
            <div className="col-span-full text-center text-red-500 mt-8">
              Error loading meal plan:{" "}
              {error instanceof Error ? error.message : "Unknown error"}
            </div>
          )}

        {!isError &&
          displayPlan.map((planDay) => (
            <DayCard
              key={planDay.date.toISOString()}
              planDay={planDay}
              // Card is visually "loading" if overlay is shown
              isLoading={showLoadingOverlay}
            />
          ))}
      </div>
    </div>
  );
};

export default MealPlanGrid;
