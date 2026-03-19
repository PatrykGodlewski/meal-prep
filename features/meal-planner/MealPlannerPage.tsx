"use client";

import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { MealPlanDisplay, MealPlannerHeader } from "./meal-plan-grid.client";
import { ShoppingListDisplay } from "./purchase-list.client";

export function MealPlannerPage() {
  const t = useTranslations("mealPlanner");

  return (
    <>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-bold text-2xl tracking-tight sm:text-3xl">
          {t("header")}
        </h1>
      </header>

      <p className="mb-6 text-muted-foreground text-sm sm:text-base">
        {t("pageDescription")}
      </p>

      <div className="mb-6">
        <Suspense fallback={null}>
          <ErrorBoundary>
            <MealPlannerHeader />
          </ErrorBoundary>
        </Suspense>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-4">
          <Suspense fallback={null}>
            <ErrorBoundary>
              <MealPlanDisplay />
            </ErrorBoundary>
          </Suspense>
        </div>

        <div className="flex flex-col gap-4 lg:sticky lg:top-6">
          <Suspense fallback={null}>
            <ErrorBoundary>
              <ShoppingListDisplay />
            </ErrorBoundary>
          </Suspense>
        </div>
      </div>
    </>
  );
}
