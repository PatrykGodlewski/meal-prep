"use server";
import { authorize } from "@/lib/authorization";
import { db } from "@/supabase";
import {
  Ingredient,
  MEAL_CATEGORY_ENUM,
  type Meal,
  type NewMealPlan,
  type NewPlannedMeal,
  ingredients,
  mealPlans,
  meals,
  plannedMeals,
} from "@/supabase/schema";
import { addDays, format, startOfWeek } from "date-fns";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { MealPlanClient } from "./types";

interface GeneratePlanResult {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Generates a weekly meal plan for the week containing the given startDate.
 * Creates meal plan entries for each day and assigns random meals for each category.
 * Skips days where a plan already exists for the authorized user.
 * @param startDate - A date within the target week.
 * @returns Promise<GeneratePlanResult> indicating success or failure.
 */
export async function generateWeeklyMealPlan(
  startDate: Date,
): Promise<GeneratePlanResult> {
  const user = await authorize();
  if (!user) {
    return {
      success: false,
      error: "User not authorized.",
      message: "Authorization failed.",
    };
  }

  const weekStart = startOfWeek(startDate, { weekStartsOn: 1 }); // Monday
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekDateStrings = weekDates.map((date) => format(date, "yyyy-MM-dd"));

  try {
    const [allMeals, existingPlansForWeek] = await Promise.all([
      db.select().from(meals),
      db
        .select({ date: mealPlans.date })
        .from(mealPlans)
        .where(
          and(
            eq(mealPlans.userId, user.id),
            inArray(mealPlans.date, weekDateStrings),
          ),
        ),
    ]);

    if (allMeals.length === 0) {
      return {
        success: false,
        error: "No meals available.",
        message: "Cannot generate plan without any meals in the database.",
      };
    }

    const existingPlanDates = new Set(existingPlansForWeek.map((p) => p.date));
    const mealsByCategory = Object.groupBy(
      allMeals,
      (meal) => meal.category ?? "other",
    );

    const mealsPerDateMap = weekDates.reduce<
      Map<string, (string | undefined)[]>
    >((map, date) => {
      const formattedDate = format(date, "yyyy-MM-dd");

      if (existingPlanDates.has(formattedDate)) {
        console.log(
          `Skipping generation for ${formattedDate} (plan already exists).`,
        );
        return map;
      }

      const newPlannedMeals = MEAL_CATEGORY_ENUM.enumValues.map((category) => {
        const availableMeals = mealsByCategory[category];

        if (!availableMeals || availableMeals.length === 0) {
          console.warn(
            `No ${category} meals available for ${formattedDate}. Skipping category.`,
          );
          return;
        }

        // TODO: Replace random selection with a proper algorithm based on preferences/settings
        const randomMeal =
          availableMeals[Math.floor(Math.random() * availableMeals.length)];

        return randomMeal.id;
      });
      map.set(formattedDate, newPlannedMeals);
      return map;
    }, new Map());

    if (mealsPerDateMap.size === 0) {
      console.log("No new meal plans needed for this week.");
      return {
        success: true,
        message: "All days this week already have meal plans.",
      };
    }

    const mealPlansToInsert = Array.from(mealsPerDateMap.entries()).map(
      ([date]) => ({ date, userId: user.id }) satisfies NewMealPlan,
    );

    await db.transaction(async (tx) => {
      const insertedMealPlans = await tx
        .insert(mealPlans)
        .values(mealPlansToInsert)
        .returning({ id: mealPlans.id, date: mealPlans.date });

      const dateToActualIdMap = new Map(
        insertedMealPlans.map((plan) => [plan.date, plan.id]),
      );

      const finalPlannedMealsValues: NewPlannedMeal[] = Array.from(
        mealsPerDateMap.entries(),
      ).reduce<NewPlannedMeal[]>((acc, [date, mealIds]) => {
        const mealPlanId = dateToActualIdMap.get(date);
        if (!mealPlanId) return acc;

        for (const mealId of mealIds) {
          if (!mealId) continue;
          acc.push({
            mealPlanId,
            mealId,
          });
        }

        return acc;
      }, []);

      if (finalPlannedMealsValues.length > 0) {
        await tx.insert(plannedMeals).values(finalPlannedMealsValues);
      } else {
        console.warn(
          "No planned meals were generated, possibly due to missing meal categories.",
        );
      }
    });

    revalidatePath("/"); // Adjust path as needed
    // Consider revalidating specific user paths if applicable
    // revalidateTag(`user-${userId}-mealplans`);

    console.log(
      `Generated meal plans for ${mealPlansToInsert.length} new day(s).`,
    );
    return {
      success: true,
      message: `Generated meal plans for ${mealPlansToInsert.length} new day(s).`,
    };
  } catch (error) {
    console.error("Error generating weekly meal plan:", error);
    const message =
      error instanceof Error
        ? error.message
        : "An unexpected database error occurred.";
    return {
      success: false,
      error: message,
      message: "Failed to generate weekly meal plan.",
    };
  }
}

/**
 * Fetches structured meal plan data for the current week for the authorized user.
 * Returns an array of 7 days, including empty days if no plan exists.
 * @returns Promise<MealPlanDayClient[]> - Array of 7 days for the week.
 */
export async function getMealPlansDataForCurrentWeek(
  currentWeek: Date,
): Promise<MealPlanClient[]> {
  // 1. Authorization
  const user = await authorize();
  const startDate = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Calculate start date once

  if (!user?.id) {
    console.error("Authorization failed in getMealPlansDataForCurrentWeek");
    return createEmptyWeekStructureForClient(startDate); // Return empty structure
  }
  const userId = user.id;

  // 2. Calculate Date Range
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
  const weekDateStrings = weekDates.map((date) => format(date, "yyyy-MM-dd"));

  try {
    // 3. Fetch Meal Plans for the User within the Date Range
    const mealPlansResult = await db
      .select({
        id: mealPlans.id,
        date: mealPlans.date, // Keep date string for mapping
      })
      .from(mealPlans)
      .where(
        and(
          eq(mealPlans.userId, userId),
          inArray(mealPlans.date, weekDateStrings),
        ),
      );

    // If no plans exist for the week, return the base structure
    if (mealPlansResult.length === 0) {
      return createEmptyWeekStructureForClient(startDate);
    }

    // 4. Prepare for Fetching Planned Meals
    const mealPlanIdToDateMap = new Map(
      mealPlansResult.map((p) => [p.id, p.date]),
    );
    const mealPlanIds = mealPlansResult.map((p) => p.id);

    // 5. Fetch All Planned Meals for these Plans, Joining with Meals
    const plannedMealsResult = await db
      .select({
        mealPlanId: plannedMeals.mealPlanId,
        meal: meals,
      })
      .from(plannedMeals)
      .innerJoin(meals, eq(plannedMeals.mealId, meals.id))
      .where(inArray(plannedMeals.mealPlanId, mealPlanIds));

    // 6. Group Planned Meals by Date String
    const mealsGroupedByDate = new Map<string, Meal[]>();
    for (const { mealPlanId, meal } of plannedMealsResult) {
      const dateString = mealPlanIdToDateMap.get(mealPlanId);
      if (!dateString) continue;

      if (mealsGroupedByDate.has(dateString)) {
        mealsGroupedByDate.get(dateString)?.push(meal);
      } else {
        mealsGroupedByDate.set(dateString, [meal]);
      }
    }

    // 7. Construct the Final 7-Day Output (without dayName)
    const finalWeekPlan = weekDates.map((date): MealPlanClient => {
      const dateString = format(date, "yyyy-MM-dd");
      const mealsForDay = mealsGroupedByDate.get(dateString) || [];

      return {
        date, // Use ISO string for client
        meals: mealsForDay,
      };
    });

    // No need to sort by dayName anymore, order comes from weekDates iteration
    return finalWeekPlan;
  } catch (error) {
    console.error("Error fetching meal plan data:", error);
    // Return empty structure on error
    return createEmptyWeekStructureForClient(startDate);
  }
}

// Helper to create base structure (can be moved to utils)
// Returns objects matching MealPlanDayClient structure but with empty meals
const createEmptyWeekStructureForClient = (
  startDate: Date,
): MealPlanClient[] => {
  const mondayStart = startOfWeek(startDate, { weekStartsOn: 1 });
  return Array.from({ length: 7 }).map((_, i) => ({
    date: addDays(mondayStart, i),
    meals: [],
  }));
};

interface IngredientWithCount {
  ingredient: Ingredient;
  count: number;
}

interface GetIngredientsResult {
  success: boolean;
  ingredients?: IngredientWithCount[];
  error?: string;
}

/**
 * Given a list of Meal objects, this server action retrieves the associated ingredients
 * and aggregates them into a single list with combined quantities.
 * @param mealList - Array of Meal objects.
 * @returns Promise<GetIngredientsResult> with either a success and ingredients list
 * or an error flag and message.
 */
export async function getAggregatedIngredients(
  mealList: Meal[],
): Promise<GetIngredientsResult> {
  try {
    const mealIds = mealList.map((meal) => meal.id);

    const ingredientsForMeals = await db
      .select()
      .from(ingredients)
      .where(inArray(ingredients.mealId, mealIds));

    const aggregatedIngredients = ingredientsForMeals.reduce(
      (acc: Record<string, IngredientWithCount>, ingredient) => {
        // Create a unique key for aggregation (name + unit)
        const key = `${ingredient.name}-${ingredient.unit}`;
        if (!acc[key]) {
          acc[key] = {
            ingredient,
            count,
          };
        }

        // Safely convert the quantity to a number, handle potential non-numeric strings
        const quantity = parseFloat(ingredient.quantity);

        if (isNaN(quantity)) {
          console.warn(
            `Invalid quantity found for ingredient ${ingredient.name}: ${ingredient.quantity}`,
          );
          return acc; // Skip this ingredient
        }
        //TODO: Add a unit system such as metric then perform total unit
        acc[key].totalQuantity += quantity;
        return acc;
      },
      {},
    ); // Type inference of this line and the one used right before is very important

    // 4. Convert Aggregated Object to Array for UI Consumption
    const ingredientsArray: IngredientWithCount[] = Object.values(
      aggregatedIngredients,
    ).map((val) => ({
      name: val.name,
      totalQuantity: val.totalQuantity,
      unit: val.unit,
      category: val.category,
    }));

    // 5. Return Successfully Aggregated Ingredient List
    return { success: true, ingredients: ingredientsArray };
  } catch (error) {
    console.error("Error getting aggregated ingredients:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Database error occurred during aggregation.";
    return { success: false, error: message };
  }
}
