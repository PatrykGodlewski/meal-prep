"use client";

import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { DashboardHeader, WelcomeBanner } from "@/components/dashboard";
import { ErrorBoundary } from "@/components/error-boundary";
import { DailyProgress } from "./DailyProgress";
import { MealPlanDisplay } from "./meal-plan-grid.client";
import { ShoppingListDisplay } from "./purchase-list.client";
import { useMealPlanner } from "./store";

export function MealPlannerPage() {
  const t = useTranslations("mealPlanner");
  const { selectedPlanId, mealPlanData } = useMealPlanner();

  const selectedPlan = mealPlanData?.find(
    (plan) => plan._id === selectedPlanId,
  );

  return (
    <main className="meal-planner-print-content mx-auto max-w-screen-xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="print:hidden">
        <DashboardHeader title={t("header")} onPrint={() => window.print()} />
      </div>

      <div className="mt-6 mb-6 print:hidden">
        <WelcomeBanner description={t("pageDescription")} />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex min-w-0 flex-col gap-4 overflow-visible">
          <Suspense fallback={null}>
            <ErrorBoundary>
              <MealPlanDisplay />
            </ErrorBoundary>
          </Suspense>
        </div>

        <div className="flex flex-col gap-4 lg:sticky lg:top-6">
          <Suspense fallback={null}>
            <ErrorBoundary>
              <DailyProgress plan={selectedPlan} />
            </ErrorBoundary>
          </Suspense>
          <Suspense fallback={null}>
            <ErrorBoundary>
              <ShoppingListDisplay />
            </ErrorBoundary>
          </Suspense>
        </div>
      </div>
    </main>
  );
}
