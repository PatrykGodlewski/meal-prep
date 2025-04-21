import { CalendarDays } from "lucide-react";
import { redirect } from "next/navigation";
import {
  MealPlanDisplay,
  MealPlannerHeader,
} from "@/features/meal-planner/meal-plan-grid.client";
import { ShoppingListDisplay } from "@/features/meal-planner/purchase-list.client";
import { Suspense } from "react";
import { ErrorBoundary } from "@/components/error-boundary";

export default function Home() {
  // const preloaded = await preloadQuery(api.myFunctions.listNumbers, {
  //   count: 3,
  // });
  //
  // const data = preloadedQueryResult(preloaded);

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
