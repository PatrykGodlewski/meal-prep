import { CalendarDays } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import {
  MealPlanDisplay,
  MealPlannerHeader,
} from "@/features/meal-planner/meal-plan-grid.client";
import { ShoppingListDisplay } from "@/features/meal-planner/purchase-list.client";

export default async function Home() {
  const t = await getTranslations("mealPlanner");
  return (
    <div>
      <h1 className="text-3xl font-semibold mb-6 flex items-center space-x-2">
        <CalendarDays className="h-7 w-7" />
        <span>{t("header")}</span>
      </h1>

      <div className="flex flex-col gap-4">
        <Suspense>
          <ErrorBoundary>
            <MealPlannerHeader />
          </ErrorBoundary>
        </Suspense>
        <Suspense>
          <ErrorBoundary>
            <MealPlanDisplay />
          </ErrorBoundary>
        </Suspense>
        <Suspense>
          <ErrorBoundary>
            <ShoppingListDisplay />
          </ErrorBoundary>
        </Suspense>
      </div>
    </div>
  );
}
