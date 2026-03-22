"use client";

import { batch } from "@legendapp/state";
import { addDays, format, isSameWeek, startOfWeek } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  RefreshCw,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDateLocale } from "@/hooks/use-date-locale";
import { cn } from "@/lib/utils";
import { PlanCard } from "./day-card";
import { GenerateWithExistingIngredientsModal } from "./GenerateWithExistingIngredientsModal";
import { useMealPlanner } from "./store";
import {
  clampDayIndex,
  differenceInCalendarDays,
  findPlanForDate,
  getDateInWeek,
  toDate,
} from "./utils";

export const MealPlanDisplay = () => {
  const t = useTranslations("mealPlanner");
  const dateLocale = useDateLocale();
  const {
    isBusy,
    isGenerating,
    mealPlanData,
    isMealPlanLoading,
    mealPlanError,
    selectedPlanId,
    selectedDate,
    currentWeek,
    mealPlannerState$,
    handleNavigateNext,
    handleNavigatePrevious,
    handleNavigateToday,
    handleGenerateMealPlan,
    handleGenerateWithExistingIngredients,
    isGeneratingWithExisting,
  } = useMealPlanner();

  const [existingIngredientsModalOpen, setExistingIngredientsModalOpen] =
    useState(false);

  const effectiveSelectedDate = toDate(selectedDate, currentWeek);
  const weekMonday = startOfWeek(currentWeek, { weekStartsOn: 1 });

  const selectedPlan =
    findPlanForDate(mealPlanData, effectiveSelectedDate) ??
    mealPlanData?.find((p) => p._id === selectedPlanId);

  const activeDay = clampDayIndex(
    differenceInCalendarDays(effectiveSelectedDate, weekMonday),
  );
  const todayIdx = clampDayIndex(
    differenceInCalendarDays(new Date(), weekMonday),
  );
  const isViewingCurrentWeek = isSameWeek(new Date(), weekMonday, {
    weekStartsOn: 1,
  });

  const days = Array.from({ length: 7 }, (_, i) =>
    format(addDays(weekMonday, i), "EEE", { locale: dateLocale }),
  );
  const getDateForDay = (i: number) =>
    format(addDays(weekMonday, i), "d", { locale: dateLocale });
  const getWeekLabel = () =>
    format(weekMonday, "MMM d, yyyy", { locale: dateLocale });

  // Sync: when selectedDate is outside loaded week, snap to a valid day
  useEffect(() => {
    const sel = toDate(mealPlannerState$.selectedDate.get(), weekMonday);
    if (isSameWeek(sel, weekMonday, { weekStartsOn: 1 })) return;

    const fallbackIdx = todayIdx;
    const fallbackDate = getDateInWeek(weekMonday, fallbackIdx);
    const sorted = [...(mealPlanData ?? [])].sort(
      (a, b) => (a.date as number) - (b.date as number),
    );
    const plan = sorted[fallbackIdx];

    batch(() => {
      mealPlannerState$.selectedDate.set(fallbackDate);
      mealPlannerState$.selectedPlanId.set(plan?._id);
    });
  }, [weekMonday.getTime(), mealPlanData, todayIdx]);

  const handleDayChange = (dayIndex: number) => {
    const date = getDateInWeek(weekMonday, dayIndex);
    const plan = findPlanForDate(mealPlanData, date);
    batch(() => {
      mealPlannerState$.selectedPlanId.set(plan?._id);
      mealPlannerState$.selectedDate.set(date);
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {(isBusy || isGenerating) && (
        <div className="flex min-h-[4lh] w-full items-center justify-center rounded-lg bg-white/70 dark:bg-black/50">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {mealPlanError && !isMealPlanLoading && (
        <div className="mt-8 text-center text-red-500">
          Error loading meal plan:{" "}
          {mealPlanError instanceof Error
            ? mealPlanError.message
            : "Unknown error"}{" "}
        </div>
      )}

      {!isBusy && !isGenerating && (
        <>
          <div className="space-y-3 overflow-visible print:hidden">
            {/* Week controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleNavigatePrevious}
                  disabled={isBusy}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                  aria-label="Previous week"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span
                  className="min-w-[90px] text-center font-semibold text-foreground text-sm"
                  suppressHydrationWarning
                >
                  {getWeekLabel()}
                </span>
                <button
                  type="button"
                  onClick={handleNavigateNext}
                  disabled={isBusy}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                  aria-label="Next week"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNavigateToday}
                  disabled={
                    isBusy || (isViewingCurrentWeek && activeDay === todayIdx)
                  }
                  className="h-8 shrink-0 text-xs"
                >
                  {t("today")}
                </Button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleGenerateMealPlan}
                  disabled={isBusy || isGenerating || isGeneratingWithExisting}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1 font-semibold text-primary text-xs transition-colors hover:bg-primary/5 hover:text-primary/80 disabled:opacity-50"
                >
                  {(isGenerating || isGeneratingWithExisting) && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  {!isGenerating && !isGeneratingWithExisting && (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  {t("generateThisWeek")}
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={
                        isBusy || isGenerating || isGeneratingWithExisting
                      }
                      aria-label={t("generateOptions")}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onSelect={() => setExistingIngredientsModalOpen(true)}
                    >
                      {t("generateWithExistingIngredients")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Days row - scrolls horizontally on small screens; py-3 + my-1 give buffer so scale-105 isn't clipped by ancestor overflow */}
            <div className="scrollbar-hide my-1 w-full overflow-x-auto px-2 py-3">
              <div className="flex w-max gap-2">
                {days.map((day, i) => {
                  const isActive = i === activeDay;
                  const isToday = i === todayIdx && isViewingCurrentWeek;
                  return (
                    <div
                      key={day}
                      className="flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center"
                    >
                      <button
                        type="button"
                        onClick={() => handleDayChange(i)}
                        className={cn(
                          "flex h-full w-full select-none flex-col items-center justify-center gap-1 rounded-2xl font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary",
                          isActive
                            ? "scale-105 bg-primary text-primary-foreground shadow-md"
                            : "border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground",
                        )}
                        aria-current={isToday ? "date" : undefined}
                      >
                        <span className="font-medium text-xs uppercase tracking-wider opacity-80">
                          {day}
                        </span>
                        <span
                          className={cn(
                            "font-bold text-base",
                            isActive && "text-primary-foreground",
                          )}
                        >
                          {getDateForDay(i)}
                        </span>
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            isToday
                              ? isActive
                                ? "bg-primary-foreground/70"
                                : "bg-primary"
                              : "invisible",
                          )}
                          aria-hidden
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <GenerateWithExistingIngredientsModal
            isOpen={existingIngredientsModalOpen}
            onOpenChange={setExistingIngredientsModalOpen}
            onGenerate={handleGenerateWithExistingIngredients}
            isGenerating={isGeneratingWithExisting}
          />

          <PlanCard plan={selectedPlan} />
        </>
      )}
    </div>
  );
};
