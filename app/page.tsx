import { CalendarDays } from "lucide-react";
import { authorize } from "@/lib/authorization";
import { redirect } from "next/navigation";
import {
  MealPlanDisplay,
  MealPlannerHeader,
} from "@/features/meal-planner/meal-plan-grid.client";
import {
  getWeeklyMealPlan,
  getWeeklyShoppingList,
} from "@/features/meal-planner/actions";
import { ShoppingListDisplay } from "@/features/meal-planner/purchase-list.client";
import { Suspense } from "react";
import { ErrorBoundary } from "@/components/error-boundary";

export default async function Home() {
  await authorize();

  // TODO: add as initial data
  // const date = new Date();
  // const weeklyMealPlan = await getWeeklyMealPlan(date);
  // const weeklyShoppingList = await getWeeklyShoppingList(date);

  return (
    <div>
      <h1 className="text-3xl font-semibold mb-6 flex items-center space-x-2">
        <CalendarDays className="h-7 w-7" />
        <span>This Week's Meal Plan</span>
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
