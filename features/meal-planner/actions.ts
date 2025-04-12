"use server";
import { authorize } from "@/lib/authorization";
import { db } from "@/supabase";
import {
  type Ingredient,
  MEAL_CATEGORY_ENUM,
  type Meal,
  type NewMealPlan,
  type NewPlannedMeal,
  mealIngredients,
  mealPlans,
  meals,
  plannedMeals,
  shoppingListItems,
} from "@/supabase/schema";
import { addDays, format, startOfWeek } from "date-fns";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { MealPlanClient } from "./types";
import type { UnitType } from "@/validators";

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
export async function getWeeklyMealPlan(
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

interface AggregatedIngredient {
  // Include ingredient definition details
  id: string; // Keep the ingredient ID
  name: string;
  unit: UnitType | null;
  category: Ingredient["category"]; // Use inferred type
  // Aggregated quantity info
  totalNumericQuantity: number | null; // Sum if possible
  quantities: string[]; // List of original text quantities
}

interface GetIngredientsResult {
  success: boolean;
  ingredients?: AggregatedIngredient[];
  error?: string;
}

/**
 * Given a list of Meal IDs, retrieves associated ingredients via relational queries
 * and aggregates them into a single list with combined quantities where possible.
 * @param mealIds - Array of Meal UUID strings.
 * @returns Promise<GetIngredientsResult>
 */
export async function getAggregatedIngredients(
  mealIds: string[],
): Promise<GetIngredientsResult> {
  // 1. Input Validation
  if (!mealIds || !Array.isArray(mealIds) || mealIds.length === 0) {
    return { success: true, ingredients: [] }; // Return empty list if no IDs
  }

  try {
    // 2. Fetch MealIngredient Links with Nested Ingredient Data using db.query
    // This fetches all mealIngredient rows linked to the specified mealIds
    // and automatically includes the related ingredient object for each row.
    const mealIngredientsWithData = await db.query.mealIngredients.findMany({
      where: inArray(mealIngredients.mealId, mealIds), // Filter by the provided meal IDs
      with: {
        ingredient: true, // Include the related ingredient data based on defined relation
      },
    });
    console.log(mealIngredientsWithData);
    // 3. Aggregate Ingredients
    const aggregatedMap = new Map<string, AggregatedIngredient>();

    for (const item of mealIngredientsWithData) {
      // Skip if the related ingredient wasn't found (data inconsistency)
      if (!item.ingredient) {
        console.warn(
          `Skipping mealIngredient link because related ingredient (ID: ${item.ingredientId}) was not found.`,
        );
        continue;
      }

      // Use the ingredient definition ID as the key for aggregation
      const key = item.ingredient.id;
      const currentQuantityStr = item.quantity;
      const currentQuantityNum = Number.parseFloat(currentQuantityStr);

      if (aggregatedMap.has(key)) {
        // biome-ignore lint/style/noNonNullAssertion: <If checks if value exists>
        const existing = aggregatedMap.get(key)!;

        if (
          Number.isNaN(currentQuantityNum) ||
          existing.totalNumericQuantity === null
        ) {
          existing.totalNumericQuantity = null;
          existing.quantities.push(currentQuantityStr);
        } else {
          existing.totalNumericQuantity += currentQuantityNum;
          existing.quantities.push(currentQuantityStr);
        }
      } else {
        aggregatedMap.set(key, {
          id: item.ingredient.id,
          name: item.ingredient.name,
          unit: item.ingredient.unit,
          category: item.ingredient.category,
          totalNumericQuantity: Number.isNaN(currentQuantityNum)
            ? null
            : currentQuantityNum,
          quantities: [currentQuantityStr],
        });
      }
    }

    const ingredientsArray = Array.from(aggregatedMap.values());

    ingredientsArray.sort((a, b) => a.name.localeCompare(b.name));

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

interface UpdateCheckResult {
  success: boolean;
  error?: string;
}

/**
 * Updates the checked status of a specific shopping list item for the authorized user.
 * @param itemId - The UUID of the shopping_list_items record.
 * @param isChecked - The new checked status (boolean).
 * @returns Promise<UpdateCheckResult>
 */
export async function updateShoppingListItemCheck(
  itemId: string,
  isChecked: boolean,
): Promise<UpdateCheckResult> {
  const user = await authorize();
  if (!user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Note: RLS policies should implicitly handle the user check,
    // but adding it here provides an extra layer before hitting the DB.
    // We might need a join to shopping_lists to verify ownership if RLS isn't enough.
    const updateResult = await db
      .update(shoppingListItems)
      .set({
        isChecked: isChecked,
        // Optional: Set checkedBy and checkedAt
        // checkedBy: userId,
        // checkedAt: new Date(),
      })
      .where(eq(shoppingListItems.id, itemId)) // Target the specific item
      // Optional: Add user check here if RLS isn't sufficient or for clarity
      // .where(and(
      //     eq(shoppingListItems.id, itemId),
      //     // You'd need to join shoppingLists here to check userId
      // ))
      .returning({ id: shoppingListItems.id }); // Check if update occurred

    if (updateResult.length === 0) {
      // This could mean the item doesn't exist OR RLS prevented the update
      return { success: false, error: "Item not found or update denied." };
    }

    // Revalidation might be less critical if relying purely on realtime,
    // but can be useful as a fallback or for immediate UI feedback before subscription updates.
    // Consider revalidating the specific list page if applicable.
    // revalidatePath('/shopping-list/[listId]');

    return { success: true };
  } catch (error) {
    console.error("Error updating shopping list item:", error);
    return { success: false, error: "Database error occurred." };
  }
}
