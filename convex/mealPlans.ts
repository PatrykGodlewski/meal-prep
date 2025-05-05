import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { addDays } from "date-fns";
import type { Id } from "./_generated/dataModel";
import { authMutation } from "./custom/mutation";
import { authQuery } from "./custom/query";
import { MEAL_CATEGORIES } from "./schema";

export const getMealPlans = authQuery({
  handler: async (ctx) => {
    const mealPlans = await ctx.db
      .query("mealPlans")
      .withIndex("by_user_and_date", (q) => q.eq("userId", ctx.user.id))
      .collect();

    return mealPlans;
  },
});

export const getMealPlan = authQuery({
  args: { mealPlanId: v.id("mealPlans") },
  handler: async (ctx, { mealPlanId }) => {
    const mealPlan = await ctx.db.get(mealPlanId);

    if (!mealPlan) {
      return null;
    }

    const plannedMeals = await ctx.db
      .query("plannedMeals")
      // TODO: use both category and meal pland id if possible and necessary
      .withIndex("by_plan_and_category", (q) => q.eq("mealPlanId", mealPlanId))
      .collect();

    const mealIds = plannedMeals.map((pm) => pm.mealId);

    const meals = (
      await Promise.all(mealIds.map((id) => ctx.db.get(id)))
    ).filter((meal): meal is NonNullable<typeof meal> => meal !== null);

    const mealMap = new Map(meals.map((meal) => [meal._id, meal]));

    const plannedMealsWithDetails = plannedMeals.map((pm) => ({
      ...pm,
      meal: mealMap.get(pm.mealId) || null,
    }));

    return {
      mealPlan,
      plannedMeals: plannedMealsWithDetails,
    };
  },
});

export const getWeeklyMealPlan = authQuery({
  args: { weekStart: v.number() },
  handler: async (ctx, { weekStart }) => {
    const startOfWeekTimestamp = weekStart;
    const endOfWeekTimestamp = addDays(weekStart, 6).getTime();

    const weeklyMealPlans = await ctx.db
      .query("mealPlans")
      .withIndex("by_user_and_date", (q) =>
        q
          .eq("userId", ctx.user.id)
          .gte("date", startOfWeekTimestamp)
          .lte("date", endOfWeekTimestamp),
      )
      .collect();

    const results = await Promise.all(
      weeklyMealPlans.map(async (mealPlan) => {
        // Fetch plannedMeals for this mealPlan
        const plannedMeals = await ctx.db
          .query("plannedMeals")
          // TODO: use both category and meal pland id if possible and necessary
          .withIndex("by_plan_and_category", (q) =>
            q.eq("mealPlanId", mealPlan._id),
          )
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

export const generateMealPlan = authMutation({
  args: { weekStart: v.number() },
  handler: async (ctx, { weekStart }) => {
    const weekDates = Array.from({ length: 7 }, (_, i) =>
      addDays(weekStart, i).getTime(),
    );

    const oldPlans = await ctx.db
      .query("mealPlans")
      .withIndex("by_user_and_date", (q) =>
        q
          .eq("userId", ctx.user.id)
          .gte("date", weekDates[0])
          .lte("date", weekDates[6]),
      )
      .collect();

    // Filter out locked plans before deletion
    const plansToDelete = oldPlans.filter((plan) => !plan.locked);

    await Promise.all(
      plansToDelete.map(async (plan) => {
        const oldPlannedMeals = await ctx.db
          .query("plannedMeals")
          // TODO: use both category and meal pland id if possible and necessary
          .withIndex("by_plan_and_category", (q) =>
            q.eq("mealPlanId", plan._id),
          )
          .collect();

        await Promise.all(oldPlannedMeals.map((pm) => ctx.db.delete(pm._id)));

        await ctx.db.delete(plan._id);
      }),
    );

    const allMeals = await ctx.db.query("meals").collect();

    if (allMeals.length === 0) {
      throw new Error(
        "No meals available (either yours or public) to generate a plan.",
      );
    }

    const categoriesToGenerate: (typeof MEAL_CATEGORIES)[number][] = [
      "breakfast",
      "lunch",
      "dinner",
      "snack",
    ];

    const mealsByCategory: Record<
      (typeof MEAL_CATEGORIES)[number],
      typeof allMeals
    > = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
      dessert: [], // Keep dessert empty or handle if needed elsewhere
    };

    for (const meal of allMeals) {
      // A meal can belong to multiple categories
      for (const category of meal?.categories ?? []) {
        // Only group if it's one of the categories we might generate for
        if (category in mealsByCategory) {
          mealsByCategory[category].push(meal);
        } else {
          // Log if a meal has a category not defined in MEAL_CATEGORIES (schema issue)
          console.warn(`Meal ${meal._id} has an invalid category: ${category}`);
        }
      }
    }

    const generatedMealPlanIds: Id<"mealPlans">[] = [];
    const lockedPlanDates = new Set(
      oldPlans.filter((plan) => plan.locked).map((plan) => plan.date),
    );

    // --- 5. Insert new meal plans and planned meals for non-locked dates ---
    for (const date of weekDates) {
      // Check if a locked plan already exists for this date
      if (lockedPlanDates.has(date)) {
        console.log(
          `Skipping generation for locked date: ${new Date(date).toISOString().split("T")[0]}`,
        );
        continue; // Skip this date as it's locked
      }

      // Proceed with creating a new meal plan for this date
      const mealPlanId = await ctx.db.insert("mealPlans", {
        userId: ctx.user.id, // Use validated userId
        date,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        // Ensure new plans are not locked by default
        locked: false,
      });

      generatedMealPlanIds.push(mealPlanId);

      // Only iterate through the specified categories to add planned meals
      for (const category of categoriesToGenerate) {
        const availableMeals = mealsByCategory[category];
        if (!availableMeals || availableMeals.length === 0) {
          console.warn(
            `No meals found for category: ${category} on ${new Date(date).toISOString().split("T")[0]}`,
          );
          continue; // Skip if no meals are available for this category
        }
        // Select a random meal from the filtered list for this category
        const randomMeal =
          availableMeals[Math.floor(Math.random() * availableMeals.length)];

        await ctx.db.insert("plannedMeals", {
          mealPlanId,
          mealId: randomMeal._id,
          category: category, // Store the category for which this meal was chosen
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
    }

    // Return IDs of the newly generated plans (excluding the locked ones)
    return { success: true, mealPlanIds: generatedMealPlanIds };
  },
});

export const updatePlannedMealByCategory = authMutation({
  args: {
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

    // 4. --- Find Existing Planned Meal for the Category ---
    // Since plannedMeals now has a 'category' field, we can query directly.
    // Note: We need an index on [mealPlanId, category] for this to be efficient.
    // Let's assume we'll add ` .index("by_plan_and_category", ["mealPlanId", "category"])` to plannedMeals in schema.ts
    const existingPlannedMeal = await ctx.db
      .query("plannedMeals")
      .withIndex("by_plan_and_category", (q) =>
        q.eq("mealPlanId", mealPlanId).eq("category", category),
      )
      .first(); // Get the first match (should be unique per plan/category)

    let plannedMealIdToReturn: Id<"plannedMeals">;

    // 5. --- Update or Insert Planned Meal ---
    if (existingPlannedMeal) {
      // Update the existing planned meal's mealId
      await ctx.db.patch(existingPlannedMeal._id, {
        mealId: newMealId,
        updatedAt: Date.now(),
      });
      plannedMealIdToReturn = existingPlannedMeal._id;
      console.log(
        `Updated planned meal ${existingPlannedMeal._id} for category ${category} in meal plan ${mealPlanId}`,
      );
    } else {
      // Insert a new planned meal if none existed for this category
      const newPlannedMealId = await ctx.db.insert("plannedMeals", {
        mealPlanId: mealPlanId,
        mealId: newMealId,
        category: category, // Store the category directly
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      plannedMealIdToReturn = newPlannedMealId;
      console.log(
        `Inserted new planned meal ${newPlannedMealId} for category ${category} in meal plan ${mealPlanId}`,
      );
    }

    // 6. --- Return Result ---
    return { success: true, plannedMealId: plannedMealIdToReturn };
  },
});

export const lockMealPlan = authMutation({
  args: {
    mealPlanId: v.id("mealPlans"),
  },
  handler: async (ctx, { mealPlanId }) => {
    const mealPlan = await ctx.db.get(mealPlanId);

    if (!mealPlan) {
      throw new Error("Meal plan not found.");
    }

    if (mealPlan.userId !== ctx.user.id) {
      throw new Error("You are not authorized to lock this meal plan.");
    }

    await ctx.db.patch(mealPlanId, {
      locked: !mealPlan.locked,
      updatedAt: Date.now(),
    });

    return { success: true, locked: !mealPlan.locked };
  },
});
