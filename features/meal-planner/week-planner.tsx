// src/app/planner/page.tsx (or relevant path)
import { db } from "@/supabase";
import { dayEnum, mealPlans, meals, plannedMeals } from "@/supabase/schema";
import type { MealCategory } from "@/validators";
import { addDays, format, startOfWeek, getDay } from "date-fns";
import { eq } from "drizzle-orm";
import { CalendarDays } from "lucide-react";
import MealPlanGrid from "./meal-plan-grid.client"; // Client component import
import { WeeklyPlanClientInput } from "@/validators/mealPlanner";
import { getMealPlansDataForCurrentWeek } from "@/app/actions";

export default async function WeekPlannerPage() {
  const structuredMealPlanData = await getMealPlansDataForCurrentWeek();

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
