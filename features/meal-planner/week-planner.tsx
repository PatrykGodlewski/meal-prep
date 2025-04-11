import { getMealPlansDataForCurrentWeek } from "@/app/actions";
import { CalendarDays } from "lucide-react";
import { MealPlanGrid } from "./meal-plan-grid.client";

export default async function WeekPlannerPage() {
  const structuredMealPlanData = await getMealPlansDataForCurrentWeek(
    new Date(),
  );

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-semibold mb-6 flex items-center space-x-2">
        <CalendarDays className="h-7 w-7" />
        <span>This Week's Meal Plan</span>
      </h1>
      <MealPlanGrid initialMealPlansData={structuredMealPlanData} />
    </div>
  );
}
