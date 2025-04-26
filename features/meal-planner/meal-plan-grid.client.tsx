"use client";

import { addDays, format, isToday } from "date-fns";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { PlanCard } from "./day-card";
import { useMealPlanner } from "./store";
import { cn } from "@/lib/utils";

export const MealPlanDisplay = () => {
  const {
    isBusy,
    isGenerating,
    mealPlanData,
    isMealPlanLoading,
    mealPlanError,
    selectedPlanId,
    mealPlannerState$,
    currentWeek,
  } = useMealPlanner();

  const planExist = mealPlanData && !!mealPlanData.length;
  const days = planExist
    ? mealPlanData.map((plan) => ({ date: plan.date, id: plan._id }))
    : new Array(7).fill(null).map((_, index) => ({
        date: addDays(currentWeek, index),
        id: undefined,
      }));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-7 sm:gap-4 gap-1 relative">
        {(isBusy || isGenerating) && (
          <div className="w-full col-span-7 flex items-center justify-center bg-white/70 dark:bg-black/50 z-10 rounded-lg min-h-[4lh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {mealPlanError && !isMealPlanLoading && (
          <div className="col-span-full text-center text-red-500 mt-8">
            Error loading meal plan:{" "}
            {mealPlanError instanceof Error
              ? mealPlanError.message
              : "Unknown error"}{" "}
          </div>
        )}
        {!isBusy &&
          !isGenerating &&
          days.map((day, idx) => {
            const isSelected = day.id === selectedPlanId || !day.id;
            return (
              <Button
                key={`${day?.id}${idx}`}
                variant="ghost"
                disabled={isSelected}
                className={cn(
                  "self-center h-auto rounded-xl w-full cursor-pointer bg-neutral-200 dark:bg-neutral-900 flex flex-col items-center justify-center p-4 sm:p-8 aspect-square",
                  {
                    "border-white border-dashed border-2": isSelected,
                    "py-5 border-2 bg-neutral-900 dark:bg-neutral-200 text-neutral-200 dark:text-neutral-900":
                      isToday(day.date),
                  },
                )}
                onClick={() => {
                  mealPlannerState$.selectedPlanId.set(day.id);
                }}
              >
                <span className="text-xs font-medium uppercase text-muted-foreground">
                  {format(day.date, "EEEEE")}
                </span>
                <span className="text-md sm:text-lg font-semibold">
                  {format(day.date, "d")}
                </span>
              </Button>
            );
          })}
      </div>

      <PlanCard
        plan={mealPlanData?.find((plan) => plan._id === selectedPlanId)}
      />
    </div>
  );
};

export function MealPlannerHeader() {
  const {
    currentWeek,
    isGenerating,
    handleNavigateNext,
    handleNavigatePrevious,
    handleGenerateMealPlan,
    isBusy,
  } = useMealPlanner();

  const title = format(currentWeek, "MMMM d, yyyy");

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
