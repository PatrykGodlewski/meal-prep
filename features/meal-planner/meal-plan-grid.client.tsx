"use client";

import { addDays, format, isToday } from "date-fns";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useDateLocale } from "@/hooks/use-date-locale";
import { cn } from "@/lib/utils";
import { PlanCard } from "./day-card";
import { useMealPlanner } from "./store";

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
  const dateLocale = useDateLocale();

  const planExist = mealPlanData && !!mealPlanData.length;
  const days = planExist
    ? mealPlanData.map((plan) => ({ date: plan.date, id: plan._id }))
    : new Array(7).fill(null).map((_, index) => ({
        date: addDays(currentWeek, index),
        id: undefined,
      }));

  return (
    <div className="flex flex-col gap-4">
      <div className="relative grid grid-cols-7 gap-1 sm:gap-4">
        {(isBusy || isGenerating) && (
          <div className="z-10 col-span-7 flex min-h-[4lh] w-full items-center justify-center rounded-lg bg-white/70 dark:bg-black/50">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {mealPlanError && !isMealPlanLoading && (
          <div className="col-span-full mt-8 text-center text-red-500">
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
                  "flex aspect-square h-auto w-full cursor-pointer flex-col items-center justify-center self-center rounded-xl bg-neutral-200 p-4 transition-shadow sm:p-8 dark:bg-neutral-900",
                  {
                    "ring-3 ring-black disabled:opacity-100 dark:ring-white":
                      isSelected,
                    "border-2 bg-neutral-900 py-5 text-neutral-200 ring-offset-2 ring-offset-neutral-950 hover:bg-neutral-800 hover:text-neutral-200 dark:bg-neutral-200 dark:text-neutral-900 dark:hover:bg-neutral-100":
                      isToday(day.date),
                  },
                )}
                onClick={() => {
                  mealPlannerState$.selectedPlanId.set(day.id);
                }}
              >
                <span className="@lg/main:block hidden font-medium text-muted-foreground text-xs uppercase">
                  {format(day.date, "EEEEEEE", { locale: dateLocale })}
                </span>

                <span className="@lg/main:hidden font-medium text-muted-foreground text-xs uppercase">
                  {format(day.date, "EEEEEE", { locale: dateLocale })}
                </span>

                <span className="font-semibold text-md sm:text-lg">
                  {format(day.date, "d", { locale: dateLocale })}
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
    handleNavigateToday,
    isBusy,
  } = useMealPlanner();

  const t = useTranslations("mealPlanner");
  const dateLocale = useDateLocale();

  const formatedWeek = format(currentWeek, "MMMM d, yyyy", {
    locale: dateLocale,
  });

  return (
    <div className="flex flex-col flex-wrap justify-between gap-4 sm:flex-row">
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handleNavigatePrevious}
          disabled={isBusy}
          aria-label="Previous Week"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <h2 className="whitespace-nowrap text-center font-semibold text-xl tabular-nums sm:text-left">
          {t("weekOf", { week: formatedWeek })}
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

      <div className="flex flex-col flex-wrap gap-4 sm:flex-row">
        <Button
          variant="outline"
          onClick={handleNavigateToday}
          disabled={isBusy}
          aria-label={t("today")}
        >
          {t("today")}
        </Button>

        <Button
          onClick={handleGenerateMealPlan}
          disabled={isBusy || isGenerating}
        >
          {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("generateThisWeek")}
        </Button>
      </div>
    </div>
  );
}
