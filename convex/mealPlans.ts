import { mutation, query } from "./_generated/server";

import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { startOfWeek, endOfWeek, addDays } from "date-fns";
import { MEAL_CATEGORIES } from "./schema";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get all meal plans for the current user
export const getMealPlans = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User must be authenticated to fetch meal plans.");
    }

    // 2. Fetch meal plans for the user using the index
    const mealPlans = await ctx.db
      .query("mealPlans")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", userId as Id<"users">),
      )
      // Consider adding .order("desc") or similar if specific ordering is needed
      .collect();

    // 3. Return the meal plans
    return mealPlans;
  },
});

// Get a specific meal plan by its ID and its associated meal IDs
export const getMealPlan = query({
  args: { mealPlanId: v.id("mealPlans") },
  handler: async (ctx, { mealPlanId }) => {
    // 1. Fetch the meal plan document
    const mealPlan = await ctx.db.get(mealPlanId);

    if (!mealPlan) {
      // Return null or throw an error if the meal plan doesn't exist
      return null;
    }

    // 2. Fetch associated planned meals using the index
    const plannedMeals = await ctx.db
      .query("plannedMeals")
      .withIndex("by_meal_plan", (q) => q.eq("mealPlanId", mealPlanId))
      .collect();

    // 3. Extract meal IDs from plannedMeals
    const mealIds = plannedMeals.map((pm) => pm.mealId);

    // 4. Fetch all corresponding meal documents in a batch
    // Filter out null results in case a meal was deleted but the plannedMeal wasn't
    const meals = (
      await Promise.all(mealIds.map((id) => ctx.db.get(id)))
    ).filter((meal): meal is NonNullable<typeof meal> => meal !== null);

    // 5. Create a map for quick lookup of meals by their ID
    const mealMap = new Map(meals.map((meal) => [meal._id, meal]));

    // 6. Combine plannedMeals with their corresponding meal data
    const plannedMealsWithDetails = plannedMeals.map((pm) => ({
      ...pm,
      meal: mealMap.get(pm.mealId) || null, // Attach the meal or null if not found
    }));

    // 7. Return the meal plan and the enriched planned meals list
    return {
      mealPlan,
      plannedMeals: plannedMealsWithDetails,
    };
  },
});

export const getWeeklyMealPlan = query({
  args: { weekStart: v.number() }, // Expecting a timestamp (milliseconds since epoch)
  handler: async (ctx, { weekStart }) => {
    // 1. Get user identity
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User must be authenticated to fetch weekly meal plans.");
    }

    // 2. Calculate start (Monday) and end (Sunday) of the week
    const inputDate = new Date(weekStart);
    const monday = startOfWeek(inputDate, { weekStartsOn: 1 });
    const startOfWeekTimestamp = monday.getTime();
    const sunday = endOfWeek(inputDate, { weekStartsOn: 1 });
    const endOfWeekTimestamp = sunday.getTime();

    // 3. Fetch meal plans for the user within the date range
    const weeklyMealPlans = await ctx.db
      .query("mealPlans")
      .withIndex("by_user_and_date", (q) =>
        q
          .eq("userId", userId as Id<"users">)
          .gte("date", startOfWeekTimestamp)
          .lte("date", endOfWeekTimestamp),
      )
      .collect();

    // 4. Fetch planned meals and their meal data for each meal plan
    const results = await Promise.all(
      weeklyMealPlans.map(async (mealPlan) => {
        // Fetch plannedMeals for this mealPlan
        const plannedMeals = await ctx.db
          .query("plannedMeals")
          .withIndex("by_meal_plan", (q) => q.eq("mealPlanId", mealPlan._id))
          .collect();

        // Fetch all mealIds for this mealPlan
        const mealIds = plannedMeals.map((pm) => pm.mealId);

        // Fetch all meals in one go (batch)
        const meals = await Promise.all(mealIds.map((id) => ctx.db.get(id)));

        // Attach meal data to each plannedMeal
        const plannedMealsWithMeal = plannedMeals.map((pm) => ({
          ...pm,
          meal: meals.find((m) => m && m._id === pm.mealId) || null,
        }));

        return {
          ...mealPlan,
          plannedMeals: plannedMealsWithMeal,
        };
      }),
    );

    // 5. Return the combined data
    return results;
  },
});

export const generateMealPlan = mutation({
  args: { weekStart: v.number() }, // timestamp (ms)
  handler: async (ctx, { weekStart }) => {
    // --- 1. Authentication ---
    const identity = await getAuthUserId(ctx);
    if (!identity) {
      throw new Error("User must be authenticated to generate a meal plan.");
    }
    const userId = identity;

    // --- 2. Calculate week dates (Monday to Sunday) ---
    const weekStartDate = startOfWeek(new Date(weekStart), { weekStartsOn: 1 });
    const weekDates = Array.from({ length: 7 }, (_, i) =>
      addDays(weekStartDate, i).getTime(),
    );

    // --- 3. Delete existing meal plans and planned meals for this week ---
    const oldPlans = await ctx.db
      .query("mealPlans")
      .withIndex("by_user_and_date", (q) =>
        q
          .eq("userId", userId) // Use validated userId
          .gte("date", weekDates[0])
          .lte("date", weekDates[6]),
      )
      .collect();

    // Use Promise.all for potentially concurrent deletion
    await Promise.all(
      oldPlans.map(async (plan) => {
        // Find planned meals associated with this specific meal plan using the index
        const oldPlannedMeals = await ctx.db
          .query("plannedMeals")
          .withIndex("by_meal_plan", (q) => q.eq("mealPlanId", plan._id))
          .collect();

        // Delete associated planned meals
        await Promise.all(oldPlannedMeals.map((pm) => ctx.db.delete(pm._id)));

        // Delete the meal plan itself
        await ctx.db.delete(plan._id);
      }),
    );

    // --- 4. Fetch all available meals (user's or public) ---
    const allMeals = await ctx.db
      .query("meals")
      .filter((q) =>
        q.or(
          q.eq(q.field("createdBy"), userId),
          q.eq(q.field("isPublic"), true),
        ),
      )
      .collect();

    if (allMeals.length === 0) {
      // Consider more specific error or returning an empty plan indication
      throw new Error(
        "No meals available (either yours or public) to generate a plan.",
      );
    }

    // Group meals by category
    const mealsByCategory: Record<string, typeof allMeals> = {};
    for (const cat of MEAL_CATEGORIES) mealsByCategory[cat] = [];
    for (const meal of allMeals) {
      // Ensure category exists before pushing
      if (mealsByCategory[meal.category]) {
        mealsByCategory[meal.category].push(meal);
      } else {
        // This case shouldn't happen if MEAL_CATEGORIES is exhaustive
        console.warn(`Meal ${meal._id} has unknown category: ${meal.category}`);
      }
    }

    const mealPlanIds: Id<"mealPlans">[] = [];
    // --- 5. Insert new meal plans and planned meals ---
    for (const date of weekDates) {
      const mealPlanId = await ctx.db.insert("mealPlans", {
        userId: userId, // Use validated userId
        date,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      mealPlanIds.push(mealPlanId);

      for (const category of MEAL_CATEGORIES) {
        const meals = mealsByCategory[category];
        if (!meals || meals.length === 0) continue;
        const randomMeal = meals[Math.floor(Math.random() * meals.length)];
        await ctx.db.insert("plannedMeals", {
          mealPlanId,
          mealId: randomMeal._id,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }

    return { success: true, mealPlanIds };
  },
});
