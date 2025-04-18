"use client";

import { useMemo } from "react";
import { format, isValid } from "date-fns";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import {
  getMonday,
  createBaseWeekStructure,
  mergeDataWithBaseStructure,
  DATE_FORMAT_DISPLAY_HEADER,
} from "@/features/meal-planner/utils";
import { PlanCard } from "./day-card";
import { ShoppingListDisplay } from "./purchase-list.client";
import { useMealPlanner } from "./store";

export function MealPlanGrid() {
  // const { shoppingListData } = useMealPlanner();

  return (
    <div className="flex flex-col gap-4">
      <MealPlannerHeader />
      <MealPlanDisplay />
      <ShoppingListDisplay />
    </div>
  );
}

function MealPlanDisplay() {
  const {
    isBusy,
    isGenerating,
    mealPlanData,
    isMealPlanLoading,
    mealPlanError,
  } = useMealPlanner();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 relative min-h-[200px]">
      {(isBusy || isGenerating) && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-black/50 z-10 rounded-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Display meal plan error if it exists and we are not currently loading */}
      {mealPlanError && !isMealPlanLoading && (
        <div className="col-span-full text-center text-red-500 mt-8">
          Error loading meal plan:{" "}
          {mealPlanError instanceof Error
            ? mealPlanError.message
            : "Unknown error"}{" "}
          {/* Consider adding a retry button */}
        </div>
      )}

      {/* Render day cards only if there are no errors */}
      {/* We can still render the grid structure even if data is loading */}
      {!mealPlanError &&
        !!mealPlanData &&
        mealPlanData.map((planDay) => (
          <PlanCard key={planDay.date.toISOString()} plan={planDay} />
        ))}
    </div>
  );
}

function MealPlannerHeader() {
  const {
    currentWeek,
    isGenerating,
    handleNavigateNext,
    handleNavigatePrevious,
    handleGenerateMealPlan,
    isBusy,
  } = useMealPlanner();

  const title = isValid(currentWeek)
    ? format(currentWeek, DATE_FORMAT_DISPLAY_HEADER)
    : "Loading...";

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handleNavigatePrevious}
          disabled={isBusy}
          aria-label="Previous Week"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-semibold text-center sm:text-left whitespace-nowrap tabular-nums">
          {`Week of ${title}`}
        </h2>
        <Button
          variant="outline"
          size="icon"
          onClick={handleNavigateNext}
          disabled={isBusy}
          aria-label="Next Week"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <Button
        onClick={handleGenerateMealPlan}
        disabled={isBusy || isGenerating}
      >
        {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Generate for This Week
      </Button>
    </div>
  );
}
