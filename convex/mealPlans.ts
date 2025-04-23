import { mutation, query } from "./_generated/server";

import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { endOfWeek, addDays } from "date-fns";
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
    const startOfWeekTimestamp = weekStart;
    const endOfWeekTimestamp = addDays(weekStart, 6).getTime();

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

    const weekDates = Array.from({ length: 7 }, (_, i) =>
      addDays(weekStart, i).getTime(),
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
    const allMeals = await ctx.db.query("meals").collect();

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

export const updatePlannedMealByCategory = mutation({
  args: {
    // Use date instead of mealPlanId
    date: v.number(), // Expecting a timestamp (milliseconds since epoch)
    category: v.union(...MEAL_CATEGORIES.map((c) => v.literal(c))),
    newMealId: v.id("meals"),
  },
  handler: async (ctx, { date, category, newMealId }) => {
    // 1. --- Authentication ---
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User must be authenticated to update a meal plan.");
    }

    // 2. --- Find or Create Meal Plan ---
    let mealPlanId: Id<"mealPlans">;
    const existingPlan = await ctx.db
      .query("mealPlans")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", userId as Id<"users">).eq("date", date),
      )
      .first();

    const now = Date.now();
    if (existingPlan) {
      mealPlanId = existingPlan._id;
      // Optional: Update the updatedAt timestamp for the meal plan itself
      // await ctx.db.patch(mealPlanId, { updatedAt: now });
    } else {
      // Create a new meal plan if it doesn't exist for this user and date
      mealPlanId = await ctx.db.insert("mealPlans", {
        userId: userId as Id<"users">,
        date,
        createdAt: now,
        updatedAt: now,
      });
      console.log(
        `Created new meal plan ${mealPlanId} for user ${userId} on date ${new Date(date).toISOString().split("T")[0]}`,
      );
    }

    // 3. --- Validate New Meal ---
    // Validate that the newMealId exists and is accessible by the user
    const newMeal = await ctx.db.get(newMealId);
    if (!newMeal) {
      throw new Error("The selected meal does not exist.");
    }
    // Optional: Add check if meal is not public and not created by user if needed
    // if (!newMeal.isPublic && newMeal.createdBy !== userId) {
    //   throw new Error("User is not authorized to use this meal.");
    // }

    // 4. --- Find Existing Planned Meal for the Category in this Meal Plan ---
    // Fetch all planned meals for this specific meal plan
    const plannedMeals = await ctx.db
      .query("plannedMeals")
      .withIndex("by_meal_plan", (q) => q.eq("mealPlanId", mealPlanId))
      .collect();

    let targetPlannedMealId: Id<"plannedMeals"> | null = null;

    // Fetch the associated meal data to check categories
    const mealIds = plannedMeals.map((pm) => pm.mealId);
    const meals = (
      await Promise.all(mealIds.map((id) => ctx.db.get(id)))
    ).filter((meal): meal is NonNullable<typeof meal> => meal !== null);
    const mealMap = new Map(meals.map((meal) => [meal._id, meal]));

    // Find the plannedMeal matching the category
    for (const pm of plannedMeals) {
      const associatedMeal = mealMap.get(pm.mealId);
      if (associatedMeal && associatedMeal.category === category) {
        targetPlannedMealId = pm._id;
        break; // Found the planned meal for this category
      }
    }

    // 4. --- Update or Insert Planned Meal ---
    if (targetPlannedMealId) {
      // Update the existing planned meal
      await ctx.db.patch(targetPlannedMealId, {
        mealId: newMealId,
        updatedAt: Date.now(),
      });
      console.log(
        `Updated planned meal ${targetPlannedMealId} for category ${category} in meal plan ${mealPlanId}`,
      );
    } else {
      // Insert a new planned meal if none existed for this category
      const newPlannedMealId = await ctx.db.insert("plannedMeals", {
        mealPlanId: mealPlanId,
        mealId: newMealId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      console.log(
        `Inserted new planned meal ${newPlannedMealId} for category ${category} in meal plan ${mealPlanId}`,
      );
      targetPlannedMealId = newPlannedMealId; // Return the ID of the newly created one
    }

    // 5. --- Return Result ---
    return { success: true, plannedMealId: targetPlannedMealId };
  },
});
