// src/app/planner/page.tsx (or relevant path)
import { db } from "@/supabase";
import { mealPlans, meals, plannedMeals } from "@/supabase/schema";
import type { MealCategory } from "@/validators";
import { addDays, format, startOfWeek, getDay } from "date-fns";
import { eq } from "drizzle-orm";
import { CalendarDays } from "lucide-react";
import MealPlanGrid from "../meal-plan-grid"; // Client component import

// Define the type passed to the client component
// Use ISO string for dates
export interface MealPlanDayClient {
  dateString: string;
  dayName: string;
  meals: {
    id: string;
    name: string;
    category: MealCategory;
  }[];
}

const daysOfWeekNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Fetches data for the current week and formats it for the client
async function getMealPlansDataForCurrentWeek(): Promise<MealPlanDayClient[]> {
  const startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

  const mealPlansForWeek = await Promise.all(
    weekDates.map(async (date): Promise<MealPlanDayClient> => {
      const formattedDate = format(date, "yyyy-MM-dd");
      const dayIndex = getDay(date);
      const dayName = daysOfWeekNames[dayIndex];

      const mealPlanResult = await db
        .select({ id: mealPlans.id })
        .from(mealPlans)
        .where(eq(mealPlans.date, formattedDate))
        .limit(1);

      if (!mealPlanResult || mealPlanResult.length === 0) {
        return {
          dateString: date.toISOString(), // Pass as ISO string
          dayName: dayName,
          meals: [],
        };
      }

      const mealPlanId = mealPlanResult[0].id;
      const plannedMealsResult = await db
        .select({
          mealId: plannedMeals.mealId,
          category: plannedMeals.category,
          mealName: meals.name,
        })
        .from(plannedMeals)
        .where(eq(plannedMeals.mealPlanId, mealPlanId))
        .leftJoin(meals, eq(plannedMeals.mealId, meals.id));

      const mealsForDay = plannedMealsResult
        .filter((pm) => pm.mealName !== null)
        .map((pm) => ({
          id: pm.mealId ?? `unknown-${Math.random()}`,
          name: pm.mealName ?? "Meal Not Found",
          category: pm.category as MealCategory,
        }));

      return {
        dateString: date.toISOString(), // Pass as ISO string
        dayName: dayName,
        meals: mealsForDay,
      };
    }),
  );

  // Ensure Monday-Sunday order based on dayName index
  const sortedPlan = mealPlansForWeek.sort((a, b) => {
    const dayA = daysOfWeekNames.indexOf(a.dayName);
    const dayB = daysOfWeekNames.indexOf(b.dayName);
    // Adjust index for sorting (Mon=1, ..., Sun=7)
    const sortA = dayA === 0 ? 7 : dayA;
    const sortB = dayB === 0 ? 7 : dayB;
    return sortA - sortB;
  });

  return sortedPlan;
}

// The Server Component
export default async function WeekPlannerPage() {
  const structuredMealPlanData = await getMealPlansDataForCurrentWeek();

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-semibold mb-6 flex items-center space-x-2">
        <CalendarDays className="h-7 w-7" />
        <span>This Week's Meal Plan</span>
      </h1>
      {/* Pass data with string dates */}
      <MealPlanGrid initialMealPlansData={structuredMealPlanData} />
    </div>
  );
}
