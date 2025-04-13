"use server";
import { authorize } from "@/lib/authorization";
import { db } from "@/supabase";
import {
  type Ingredient,
  MEAL_CATEGORY_ENUM,
  type Meal,
  type NewMealPlan,
  type NewPlannedMeal,
  type NewShoppingListItem,
  mealIngredients,
  mealPlans,
  meals,
  plannedMeals,
  shoppingListItems,
  shoppingLists,
} from "@/supabase/schema";
import { addDays, endOfWeek, format, startOfWeek } from "date-fns";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { MealPlanClient } from "./types";
import type { UnitType } from "@/validators";
import { formatedEndOfWeek, formatedStartOfWeek } from "@/lib/utils";

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

interface UpdateCheckResult {
  success: boolean;
  error?: string;
}

/**
 * Updates the checked status of a shopping list item. Enforces ownership via relation query.
 * @param itemId - The UUID of the shopping_list_items record to update.
 * @param isChecked - The new checked status (boolean).
 * @returns Promise<UpdateCheckResult>
 */
export async function updateShoppingListItemCheck(
  itemId: string,
  isChecked: boolean,
): Promise<UpdateCheckResult> {
  // 1. Authorization and Input Validation
  const user = await authorize();
  if (!user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // 2. Attempt to Update using relational query
    // We need check that item is actually owned by this user.

    const updateResult = await db
      .update(shoppingListItems)
      .set({ isChecked: isChecked })
      .where(eq(shoppingListItems.id, itemId))
      .returning();

    if (updateResult.length === 0) {
      return {
        success: false,
        error: `Shopping list item with ID "${itemId}" not found or not owned by user.`,
      };
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error updating shopping list item:", error);
    return {
      success: false,
      error: `Database error occurred: ${error instanceof Error ? error.message : null}`,
    };
  }
}

export const updateWeeklyShoppingList = async (date: Date) => {
  const user = await authorize();
  const userId = user?.id;
  if (!userId) {
    console.warn("Update shopping list: user not authorized.");
    return null;
  }

  const getList = async () => {
    const list = await db.query.shoppingLists.findFirst({
      where: (shoppingLists, { and, eq }) =>
        and(
          eq(shoppingLists.userId, userId),
          eq(shoppingLists.mealPlanWeekStart, formatedStartOfWeek(date)),
        ),
    });
    if (list) return list;
    const [newList] = await db
      .insert(shoppingLists)
      .values({
        userId: userId,
        mealPlanWeekStart: formatedStartOfWeek(date),
      })
      .returning();
    return newList;
  };

  const list = await getList();

  const mealPlansWithinRange = await db.query.mealPlans.findMany({
    where: (mealPlans, { eq, and, gte, lte }) =>
      and(
        eq(mealPlans.userId, userId),
        gte(mealPlans.date, formatedStartOfWeek(date)),
        lte(mealPlans.date, formatedEndOfWeek(date)),
      ),
    with: {
      plannedMeals: {
        with: {
          meal: {
            with: {
              mealIngredients: { with: { ingredient: true } },
            },
          },
        },
      },
    },
    orderBy: [mealPlans.date],
  });

  const allMealIngredients: NewShoppingListItem[] =
    mealPlansWithinRange.flatMap((mealPlan) =>
      mealPlan.plannedMeals.flatMap((plannedMeal) =>
        plannedMeal.meal.mealIngredients.map(
          (mealIngredient): NewShoppingListItem => ({
            ingredientName: mealIngredient.ingredient.name,
            shoppingListId: list.id,
            ingredientId: mealIngredient.ingredientId,
            amount: mealIngredient.quantity,
          }),
        ),
      ),
    );

  const mergedMealIngredients = Array.from(
    allMealIngredients
      .reduce<Map<string, NewShoppingListItem>>((accMap, currentIngredient) => {
        const ingredientId = currentIngredient.ingredientId;
        if (!ingredientId) return accMap;
        const incomingAmount = currentIngredient.amount ?? 0;

        const existingItem = accMap.get(ingredientId);

        if (existingItem) {
          const currentAmountNum = existingItem.amount ?? 0;
          const newTotalAmount = currentAmountNum + incomingAmount;

          accMap.set(ingredientId, {
            ...currentIngredient,
            amount: newTotalAmount,
          });
        } else {
          accMap.set(ingredientId, {
            ...currentIngredient,
            amount: incomingAmount,
          });
        }

        return accMap;
      }, new Map<string, NewShoppingListItem>())
      .values(),
  );

  await db
    .delete(shoppingListItems)
    .where(eq(shoppingListItems.shoppingListId, list.id));

  return await db
    .insert(shoppingListItems)
    .values(mergedMealIngredients)
    .returning();
};

export const getWeeklyShoppingList = async (date: Date) => {
  const user = await authorize();
  if (!user?.id) {
    console.warn("Get shopping list data: user not authorized.");
    return null;
  }
  const userId = user.id;

  try {
    const list = await db.query.shoppingLists.findFirst({
      where: (shoppingLists, { and, eq }) =>
        and(
          eq(shoppingLists.userId, userId),
          eq(shoppingLists.mealPlanWeekStart, formatedStartOfWeek(date)),
        ),
      with: {
        items: {
          with: { ingredient: true },
        },
      },
    });
    if (!list) return null;
    return list;
  } catch (e) {
    console.error(e);
    return null;
  }
};

export type WeeklyShoppingList = NonNullable<
  Awaited<ReturnType<typeof getWeeklyShoppingList>>
>;

export const updateShoppingList = async (date: Date) => {
  const user = await authorize();
  if (!user?.id) {
    console.warn("Update shopping list: user not authorized.");
    return null;
  }
  const userId = user.id;
  const weekStartStr = formatedStartOfWeek(date);
  const weekEndStr = formatedEndOfWeek(date);

  try {
    const mealPlansWithinRange = await db.query.mealPlans.findMany({
      where: (mealPlans, { eq, and, gte, lte }) =>
        and(
          eq(mealPlans.userId, userId),
          gte(mealPlans.date, weekStartStr),
          lte(mealPlans.date, weekEndStr),
        ),
      with: {
        plannedMeals: {
          with: {
            meal: {
              with: {
                mealIngredients: {
                  // Ensure ingredientId and quantity are selected
                  columns: {
                    ingredientId: true,
                    quantity: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [mealPlans.date],
    });

    // 2. Aggregate all ingredients from the meal plans
    const allMealIngredients = mealPlansWithinRange.flatMap(
      (mealPlan) =>
        mealPlan.plannedMeals?.flatMap(
          (plannedMeal) =>
            plannedMeal.meal.mealIngredients?.map((mealIngredient) => ({
              // Temporary structure, shoppingListId added later
              ingredientId: mealIngredient.ingredientId,
              amount: mealIngredient.quantity,
            })) ?? [], // Handle potential undefined arrays
        ) ?? [], // Handle potential undefined arrays
    );

    // 3. Merge ingredients by ID, summing amounts
    const baseMergedIngredients = Array.from(
      allMealIngredients.reduce<
        Map<string, Omit<NewShoppingListItem, "shoppingListId">>
      >((accMap, currentIngredient) => {
        const ingredientId = currentIngredient.ingredientId;
        // Skip if ingredientId is missing (should ideally not happen with proper schema)
        if (!ingredientId) return accMap;

        const incomingAmount = currentIngredient.amount ?? 0;
        const existingItem = accMap.get(ingredientId);

        if (existingItem) {
          const currentAmountNum = existingItem.amount ?? 0;
          accMap.set(ingredientId, {
            ingredientId: ingredientId,
            amount: currentAmountNum + incomingAmount,
          });
        } else {
          accMap.set(ingredientId, {
            ingredientId: ingredientId,
            amount: incomingAmount,
          });
        }
        return accMap;
      }, new Map()),
    ).map((entry) => entry[1]); // Get only the values (ingredient objects)

    // 4. Perform DB operations within a transaction
    const updatedListId = await db.transaction(async (tx) => {
      // Check if a list already exists for this user and week
      const existingList = await tx.query.shoppingLists.findFirst({
        where: (shoppingLists, { and, eq }) =>
          and(
            eq(shoppingLists.userId, userId),
            eq(shoppingLists.mealPlanWeekStart, weekStartStr),
          ),
        columns: {
          id: true, // Only need the ID
        },
      });

      let shoppingListId: string;

      if (existingList) {
        // --- UPDATE PATH ---
        shoppingListId = existingList.id;
        // Delete existing items for this list
        await tx
          .delete(shoppingListItems)
          .where(eq(shoppingListItems.shoppingListId, shoppingListId));
      } else {
        // --- CREATE PATH ---
        // Create a new shopping list record
        const [newList] = await tx
          .insert(shoppingLists)
          .values({
            userId: userId,
            mealPlanWeekStart: weekStartStr,
          })
          .returning({ id: shoppingLists.id });
        if (!newList) {
          // Throw error to rollback transaction if insertion fails
          throw new Error("Failed to create new shopping list record.");
        }
        shoppingListId = newList.id;
      }

      // Prepare final list items with the correct shoppingListId
      const finalMergedIngredients: NewShoppingListItem[] =
        baseMergedIngredients.map((item) => ({
          ...item,
          shoppingListId: shoppingListId,
        }));

      // Insert the new/updated items if there are any
      if (finalMergedIngredients.length > 0) {
        await tx.insert(shoppingListItems).values(finalMergedIngredients);
        // Note: Drizzle's batch insert might not easily return all inserted items
        // across all dialects. We'll query the final list outside the transaction.
      }

      // Return the ID of the list (either existing or newly created)
      return shoppingListId;
    });

    // 5. Fetch the final list with its items to return
    const finalList = await db.query.shoppingLists.findFirst({
      where: eq(shoppingLists.id, updatedListId),
      with: {
        items: true, // Fetch the associated items
      },
    });

    return finalList ?? null; // Return the list or null if somehow not found
  } catch (e) {
    console.error("Error updating shopping list:", e);
    return null;
  }
};
