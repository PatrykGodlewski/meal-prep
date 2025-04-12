import { CalendarDays } from "lucide-react";
import { authorize } from "@/lib/authorization";
import { redirect } from "next/navigation";
import { MealPlanGrid } from "@/features/meal-planner/meal-plan-grid.client";
import {
  getWeeklyMealPlan,
  getWeeklyShoppingList,
} from "@/features/meal-planner/actions";

export default async function Home() {
  const user = await authorize();

  if (!user) {
    return redirect("/sign-in");
  }
  const date = new Date();
  const weeklyMealPlan = await getWeeklyMealPlan(date);
  const weeklyShoppingList = await getWeeklyShoppingList(date);

  return (
    <div>
      <h1 className="text-3xl font-semibold mb-6 flex items-center space-x-2">
        <CalendarDays className="h-7 w-7" />
        <span>This Week's Meal Plan</span>
      </h1>
      <MealPlanGrid
        initialMealPlansData={weeklyMealPlan}
        initialShoppingList={weeklyShoppingList}
      />
    </div>
  );
}
