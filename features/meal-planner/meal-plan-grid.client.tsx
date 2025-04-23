"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { format, isToday } from "date-fns";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { PlanCard } from "./day-card";
import { useMealPlanner } from "./store";
import { cn } from "@/lib/utils";
import {
  observer,
  use$,
  useObservable,
  useSelector,
} from "@legendapp/state/react";

export const MealPlanDisplay = observer(() => {
  const {
    isBusy,
    isGenerating,
    mealPlanData,
    isMealPlanLoading,
    mealPlanError,
    selectedPlanId,
    mealPlannerState$,
  } = useMealPlanner();

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 relative">
        {(isBusy || isGenerating) && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-black/50 z-10 rounded-lg">
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

        {!mealPlanError &&
          !!mealPlanData &&
          !!mealPlanData.length &&
          mealPlanData.map((planDay) => (
            <div
              onClick={() => {
                mealPlannerState$.selectedPlanId.set(planDay._id);
              }}
              key={planDay._id}
              className={cn(
                "rounded-xl  cursor-pointer bg-neutral-900 flex flex-col items-center justify-center p-8 aspect-square",
                {
                  "bg-neutral-700 cursor-auto": planDay._id === selectedPlanId,
                },
              )}
            >
              <span className="text-xs font-medium uppercase text-muted-foreground">
                {format(planDay.date, "EEEEE")}
              </span>
              <span className="text-lg font-semibold">
                {format(planDay.date, "d")}
              </span>
            </div>
          ))}
      </div>

      <PlanCard
        plan={mealPlanData?.find((plan) => plan._id === selectedPlanId)}
      />
    </div>
  );
});

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
