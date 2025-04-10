import { db } from "@/supabase";
import { mealPlans, meals, plannedMeals } from "@/supabase/schema";
import type { MealCategory } from "@/validators";
import { addDays, format, startOfWeek } from "date-fns";
import { eq } from "drizzle-orm";
import { CalendarDays } from "lucide-react";
import MealPlanGrid from "./meal-plan-grid";
import { Button } from "./ui/button";
import { generateWeeklyMealPlan } from "@/app/actions";

interface MealPlanWithMeals {
  date: Date;
  day: string;
  meals: {
    name: string;
    category: MealCategory;
  }[];
}

async function getMealPlansData(): Promise<MealPlanWithMeals[]> {
  const startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

  const mealPlansForWeek = await Promise.all(
    weekDates.map(async (date) => {
      const formattedDate = format(date, "yyyy-MM-dd");

      const mealPlan = await db
        .select()
        .from(mealPlans)
        .where(eq(mealPlans.date, formattedDate))
        .limit(1);

      if (!mealPlan || mealPlan.length === 0) {
        return {
          date: date,
          day: format(date, "EEEE"),
          meals: [],
        };
      }

      const plannedMealsForPlan = await db
        .select()
        .from(plannedMeals)
        .where(eq(plannedMeals.mealPlanId, mealPlan[0].id))
        .leftJoin(meals, eq(plannedMeals.mealId, meals.id));

      return {
        date: date,
        day: format(date, "EEEE"),
        meals: plannedMealsForPlan.map((pm) => ({
          // TODO: fix
          name: pm.meals?.name ?? "not_provided",
          category: pm.planned_meals.category,
        })),
      };
    }),
  );

  return mealPlansForWeek;
}

export default async function WeekPlanner() {
  const mealPlansData = await getMealPlansData();

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-semibold mb-5 flex items-center space-x-2">
        <CalendarDays className="h-6 w-6" />
        <span>This Week's Meal Plans</span>
      </h1>
      <MealPlanGrid mealPlansData={mealPlansData} />
    </div>
  );
}
