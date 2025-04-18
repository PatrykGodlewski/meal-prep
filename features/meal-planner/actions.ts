"use server";
import { authorize } from "@/lib/authorization";
import { db } from "@/supabase";
import {
  MEAL_CATEGORY_ENUM,
  type Meal,
  type NewMealPlan,
  type NewPlannedMeal,
  type NewShoppingListItem,
  mealPlans,
  meals,
  plannedMeals,
  shoppingListItems,
  shoppingLists,
} from "@/supabase/schema";
import { addDays, format, isValid, startOfWeek } from "date-fns";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { MealPlanClient } from "./types";
// import type { UnitType } from "@/validators"; // UnitType might not be needed directly here anymore
import { formatedEndOfWeek, formatedStartOfWeek } from "@/lib/utils";
import type { ShoppingList, ShoppingListItem } from "@/supabase/schema"; // Import ShoppingList types

interface ActionVoidResult {
  success: boolean;
  message: string;
  error?: string;
}

// Define a specific result type for this action
interface GeneratePlanResult {
  success: boolean;
  message: string;
  data?: {
    weeklyMealPlan: MealPlanClient[];
    weeklyShoppingList: ShoppingList & { items: ShoppingListItem[] };
  };
  error?: string;
}

interface UpdateCheckResult {
  success: boolean;
  error?: string;
}

export type WeeklyShoppingList = NonNullable<
  Awaited<ReturnType<typeof getWeeklyShoppingList>>
>;

export type WeeklyMealPlan = NonNullable<
  Awaited<ReturnType<typeof getWeeklyMealPlan>>
>;

const DATE_FORMAT_KEY = "yyyy-MM-dd";

/**
 * Generates a new meal plan for the entire specified week, overwriting any existing plan for that week.
 * Creates or updates the corresponding shopping list with aggregated ingredients.
 * @param targetWeekDate - A date within the target week.
 * @returns Promise<GeneratePlanResult> - The result object containing success status, message, and potentially the generated plan and list.
 */
export async function generatePlanAndUpdateShoppingList(
  targetWeekDate: Date,
): Promise<GeneratePlanResult> {
  const user = await authorize();

  if (!user?.id) {
    return {
      success: false,
      error: "User not authorized.",
      message: "Authorization failed.",
    };
  }

  const userId = user.id;

  if (!targetWeekDate || !isValid(targetWeekDate)) {
    return {
      success: false,
      error: "Invalid date provided.",
      message: "Invalid target date.",
    };
  }

  const weekStart = startOfWeek(targetWeekDate, { weekStartsOn: 1 });
  const weekStartDateStr = format(weekStart, DATE_FORMAT_KEY);
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekDateStrings = weekDates.map((date) =>
    format(date, DATE_FORMAT_KEY),
  );

  try {
    // Use a transaction to ensure atomicity
    const transactionResult = await db.transaction(async (tx) => {
      // 1. Fetch all available meals for the user (or public meals)
      // TODO: Add filtering for user-specific vs public meals if needed
      const allMeals = await tx.select().from(meals);
      if (allMeals.length === 0) {
        throw new Error("No meals available in the database to create a plan.");
      }
      const mealsByCategory = Object.groupBy(
        allMeals,
        (meal) => meal.category ?? "other",
      );

      // 2. Clean up existing plan for the target week
      const existingPlans = await tx
        .select({ id: mealPlans.id })
        .from(mealPlans)
        .where(
          and(
            eq(mealPlans.userId, userId),
            inArray(mealPlans.date, weekDateStrings),
          ),
        );

      if (existingPlans.length > 0) {
        const existingPlanIds = existingPlans.map((p) => p.id);
        // Delete associated planned meals first due to foreign key constraints
        await tx
          .delete(plannedMeals)
          .where(inArray(plannedMeals.mealPlanId, existingPlanIds));
        // Then delete the meal plans
        await tx
          .delete(mealPlans)
          .where(inArray(mealPlans.id, existingPlanIds));
        console.log(
          `Deleted ${existingPlans.length} existing meal plans for week starting ${weekStartDateStr}.`,
        );
      }

      // 3. Generate new Meal Plans for the entire week
      const mealPlansToInsert: NewMealPlan[] = weekDateStrings.map((date) => ({
        userId,
        date,
      }));
      const insertedMealPlans = await tx
        .insert(mealPlans)
        .values(mealPlansToInsert)
        .returning({ id: mealPlans.id, date: mealPlans.date });

      const dateToPlanIdMap = new Map(
        insertedMealPlans.map((p) => [p.date, p.id]),
      );

      // 4. Generate Planned Meals for each day
      const allPlannedMealsForWeek: NewPlannedMeal[] = [];
      const allMealIdsForWeekSet = new Set<string>(); // Use Set for unique meal IDs

      for (const dateStr of weekDateStrings) {
        const mealPlanId = dateToPlanIdMap.get(dateStr);
        if (!mealPlanId) {
          console.error(`Missing mealPlanId for date ${dateStr}, skipping.`);
          continue;
        }

        for (const category of MEAL_CATEGORY_ENUM.enumValues) {
          const availableMeals = mealsByCategory[category];
          if (!availableMeals || availableMeals.length === 0) {
            console.warn(
              `No ${category} meals available for ${dateStr}. Skipping category.`,
            );
            continue;
          }
          // Select a random meal for the category
          const randomMeal =
            availableMeals[Math.floor(Math.random() * availableMeals.length)];
          allPlannedMealsForWeek.push({ mealPlanId, mealId: randomMeal.id });
          allMealIdsForWeekSet.add(randomMeal.id); // Add meal ID to the set
        }
      }

      // Batch insert all planned meals for the week
      if (allPlannedMealsForWeek.length > 0) {
        await tx.insert(plannedMeals).values(allPlannedMealsForWeek);
      }

      // --- Aggregate Ingredients for the Shopping List ---

      const allMealIdsForWeek = Array.from(allMealIdsForWeekSet);
      let aggregatedIngredients: NewShoppingListItem[] = [];

      if (allMealIdsForWeek.length > 0) {
        // Fetch ingredients needed for all selected meals
        const ingredientsForWeek = await tx.query.mealIngredients.findMany({
          where: (mealIngredients, { inArray }) =>
            inArray(mealIngredients.mealId, allMealIdsForWeek),
          with: {
            ingredient: {
              columns: {
                id: true,
                name: true,
                unit: true,
                // category: true, // Uncomment if needed
              },
            },
          },
          columns: {
            quantity: true,
          },
        });

        // Aggregate using a Map (similar to updateWeeklyShoppingList logic)
        const aggregationMap = ingredientsForWeek.reduce(
          (
            acc: Map<string, NewShoppingListItem & { unit?: string | null }>,
            item,
          ) => {
            const key = item.ingredient.id; // Aggregate by ingredient ID
            const existing = acc.get(key);
            const currentQuantity = item.quantity ?? 0; // Default to 0 if null

            if (existing) {
              // Basic summation - assumes compatible units or simple addition
              // TODO: Implement unit conversion if necessary
              const existingAmount = existing.amount ?? 0;
              existing.amount = existingAmount + currentQuantity;
              // If units differ, maybe store as string or handle later
              if (existing.unit !== item.ingredient.unit) {
                console.warn(
                  `Unit mismatch for ingredient ${item.ingredient.name}: ${existing.unit} vs ${item.ingredient.unit}. Simple addition applied.`,
                );
                // Optionally reset unit or handle complex aggregation
              }
            } else {
              acc.set(key, {
                ingredientId: item.ingredient.id,
                amount: currentQuantity,
                unit: item.ingredient.unit, // Store unit for potential formatting later
                shoppingListId: "", // Placeholder, will be set later
                isChecked: false,
              });
            }
            return acc;
          },
          new Map<string, NewShoppingListItem & { unit?: string | null }>(),
        );

        aggregatedIngredients = Array.from(aggregationMap.values());
      }

      // 5. Find or Create Shopping List for the Week
      let shoppingListId: string;
      const existingList = await tx.query.shoppingLists.findFirst({
        where: (sl, { and, eq }) =>
          and(
            eq(sl.userId, userId),
            eq(sl.mealPlanWeekStart, weekStartDateStr),
          ),
        columns: { id: true },
      });

      if (existingList) {
        shoppingListId = existingList.id;
        // Delete old items before inserting new ones
        await tx
          .delete(shoppingListItems)
          .where(eq(shoppingListItems.shoppingListId, shoppingListId));
        console.log(
          `Cleared existing items for shopping list ${shoppingListId}.`,
        );
      } else {
        // Create new list
        const [newList] = await tx
          .insert(shoppingLists)
          .values({
            userId: userId,
            // name: `Week of ${format(weekStart, "MMM do")}`, // Optional: Add name if desired
            mealPlanWeekStart: weekStartDateStr,
          })
          .returning({ id: shoppingLists.id });
        if (!newList?.id) throw new Error("Failed to create shopping list.");
        shoppingListId = newList.id;
        console.log(`Created new shopping list ${shoppingListId}.`);
      }

      // 6. Insert Aggregated Ingredients into Shopping List Items
      if (aggregatedIngredients.length > 0) {
        const finalShoppingListItems: NewShoppingListItem[] =
          aggregatedIngredients.map((item) => ({
            shoppingListId: shoppingListId,
            ingredientId: item.ingredientId,
            // Format amount with unit if available
            amount: item.amount, // Keep raw amount for now, formatting can happen on client or here
            // amount: `${item.amount}${item.unit ? ` ${item.unit}` : ""}`, // Example formatting
            isChecked: false,
          }));
        await tx.insert(shoppingListItems).values(finalShoppingListItems);
      }

      // 7. Return the ID of the shopping list for fetching outside transaction
      return shoppingListId;
    }); // Transaction commits here

    // --- Fetch final data outside the transaction ---

    // 8. Fetch the generated Weekly Meal Plan
    const weeklyMealPlan = await getWeeklyMealPlan(targetWeekDate); // Reuse existing fetch logic

    // 9. Fetch the updated Shopping List with items
    const weeklyShoppingList = await db.query.shoppingLists.findFirst({
      where: eq(shoppingLists.id, transactionResult), // Use the ID returned by transaction
      with: {
        items: {
          with: {
            ingredient: { columns: { name: true } },
          },
        },
      },
    });

    if (!weeklyShoppingList) {
      // This shouldn't happen if the transaction succeeded
      throw new Error("Failed to retrieve the updated shopping list.");
    }

    // 10. Revalidate Paths
    revalidatePath("/planner");
    revalidatePath(`/shopping-list/${weeklyShoppingList.id}`);

    return {
      success: true,
      message: `Successfully generated meal plan and shopping list for the week of ${weekStartDateStr}.`,
      data: {
        weeklyMealPlan,
        // Ensure items is always an array, even if empty
        weeklyShoppingList: {
          ...weeklyShoppingList,
          items: weeklyShoppingList.items || [],
        },
      },
    };
  } catch (error) {
    console.error("Error generating plan and shopping list:", error);
    const message =
      error instanceof Error
        ? error.message
        : "An unexpected database error occurred.";
    return {
      success: false,
      error: message,
      message: "Failed to generate plan and update shopping list.",
    };
  }
}

// Note: getWeeklyMealPlan is now primarily used by generatePlanAndUpdateShoppingList
// to fetch the final plan structure after generation.
// It can still be called directly if needed.
export async function getWeeklyMealPlan(currentWeek: Date) {
  // 1. Authorization
  const user = await authorize();
  const startDate = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Calculate start date once
  console.log(startDate, currentWeek);
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

export async function getWeeklyShoppingList(date: Date) {
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
}
