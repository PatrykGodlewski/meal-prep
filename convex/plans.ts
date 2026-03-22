import { v } from "convex/values";
import { addDays } from "date-fns";
import type { Id } from "./_generated/dataModel";
import { authMutation } from "./custom/mutation";
import { authQuery } from "./custom/query";
import * as ShoppingList from "./model/shoppingList";
import { MEAL_CATEGORIES } from "./schema";

export const getMealPlans = authQuery({
  handler: async (ctx) => {
    const plans = await ctx.db
      .query("plans")
      .withIndex("by_user_and_date", (q) => q.eq("userId", ctx.user.id))
      .collect();

    return plans;
  },
});

export const getMealPlan = authQuery({
  args: { mealPlanId: v.id("plans") },
  handler: async (ctx, { mealPlanId: planId }) => {
    const mealPlan = await ctx.db.get(planId);

    if (!mealPlan) {
      return null;
    }

    const [planMeals, planExtras] = await Promise.all([
      ctx.db
        .query("planMeals")
        .withIndex("by_plan_and_category", (q) => q.eq("planId", planId))
        .collect(),
      ctx.db
        .query("planExtras")
        .withIndex("by_plan", (q) => q.eq("planId", planId))
        .collect(),
    ]);

    const allMealIds = [
      ...planMeals.map((pm) => pm.mealId),
      ...planExtras.map((pe) => pe.mealId),
    ];
    const meals = (
      await Promise.all([...new Set(allMealIds)].map((id) => ctx.db.get(id)))
    ).filter((meal): meal is NonNullable<typeof meal> => meal !== null);

    const mealMap = new Map(meals.map((meal) => [meal._id, meal]));

    const planMealsWithDetails = planMeals.map((pm) => ({
      ...pm,
      meal: mealMap.get(pm.mealId) || null,
    }));

    const planExtrasWithMeal = planExtras.map((pe) => ({
      ...pe,
      meal: mealMap.get(pe.mealId) || null,
    }));

    return {
      mealPlan,
      planMeals: planMealsWithDetails,
      planExtras: planExtrasWithMeal,
    };
  },
});

export const getWeeklyMealPlan = authQuery({
  args: { weekStart: v.number() },
  handler: async (ctx, { weekStart }) => {
    const startOfWeekTimestamp = weekStart;
    const endOfWeekTimestamp = addDays(weekStart, 6).getTime();

    const weeklyPlans = await ctx.db
      .query("plans")
      .withIndex("by_user_and_date", (q) =>
        q
          .eq("userId", ctx.user.id)
          .gte("date", startOfWeekTimestamp)
          .lte("date", endOfWeekTimestamp),
      )
      .collect();

    const results = await Promise.all(
      weeklyPlans.map(async (mealPlan) => {
        const [planMeals, planExtras] = await Promise.all([
          ctx.db
            .query("planMeals")
            .withIndex("by_plan_and_category", (q) =>
              q.eq("planId", mealPlan._id),
            )
            .collect(),
          ctx.db
            .query("planExtras")
            .withIndex("by_plan", (q) => q.eq("planId", mealPlan._id))
            .collect(),
        ]);

        const allMealIds = [
          ...planMeals.map((pm) => pm.mealId),
          ...planExtras.map((pe) => pe.mealId),
        ];
        const meals = await Promise.all(
          [...new Set(allMealIds)].map((id) => ctx.db.get(id)),
        );
        const mealMap = new Map(
          meals
            .filter((m): m is NonNullable<typeof m> => m !== null)
            .map((m) => [m._id, m]),
        );

        const planMealsWithMeal = planMeals.map((pm) => ({
          ...pm,
          meal: mealMap.get(pm.mealId) || null,
        }));

        const planExtrasWithMeal = planExtras.map((pe) => ({
          ...pe,
          meal: mealMap.get(pe.mealId) || null,
        }));

        return {
          ...mealPlan,
          planMeals: planMealsWithMeal.sort((a, b) => {
            const indexA = a.category ? MEAL_CATEGORIES.indexOf(a.category) : 0;
            const indexB = b.category ? MEAL_CATEGORIES.indexOf(b.category) : 0;

            if (indexA === -1 || indexB === -1) {
              return 0;
            }

            return indexA - indexB;
          }),
          planExtras: planExtrasWithMeal,
        };
      }),
    );

    // 5. Return the combined data
    return results;
  },
});

export const generateMealPlan = authMutation({
  args: {
    weekStart: v.number(),
    existingIngredientIds: v.optional(v.array(v.id("ingredients"))),
  },
  handler: async (ctx, { weekStart, existingIngredientIds }) => {
    const weekDates = Array.from({ length: 7 }, (_, i) =>
      addDays(weekStart, i).getTime(),
    );

    const oldPlans = await ctx.db
      .query("plans")
      .withIndex("by_user_and_date", (q) =>
        q
          .eq("userId", ctx.user.id)
          .gte("date", weekDates[0])
          .lte("date", weekDates[6]),
      )
      .collect();

    // Filter out locked plans before deletion
    const plansToClearMeals = oldPlans.filter((plan) => !plan.locked);

    await Promise.all(
      plansToClearMeals.map(async (plan) => {
        const oldplanMeals = await ctx.db
          .query("planMeals")
          // TODO: use both category and meal pland id if possible and necessary
          .withIndex("by_plan_and_category", (q) => q.eq("planId", plan._id))
          .collect();

        await Promise.all(oldplanMeals.map((pm) => ctx.db.delete(pm._id)));
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
      dessert: [],
      drinks: [],
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

    const userFavouriteMealIds = new Set(
      (
        await ctx.db
          .query("mealFavourites")
          .withIndex("by_user", (q) => q.eq("userId", ctx.user.id))
          .collect()
      ).map((r) => r.mealId),
    );

    const generatedMealPlanIds: Id<"plans">[] = [];
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
      let planId = null;

      const existingMealPlanId = plansToClearMeals.find(
        (plan) => plan.date === date,
      );

      if (existingMealPlanId) {
        planId = existingMealPlanId._id;
      } else {
        planId = await ctx.db.insert("plans", {
          userId: ctx.user.id, // Use validated userId
          date,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          // Ensure new plans are not locked by default
          locked: false,
        });
      }

      generatedMealPlanIds.push(planId);

      // Only iterate through the specified categories to add planned meals
      for (const category of categoriesToGenerate) {
        const availableMeals = mealsByCategory[category];
        if (!availableMeals || availableMeals.length === 0) {
          console.warn(
            `No meals found for category: ${category} on ${new Date(date).toISOString().split("T")[0]}`,
          );
          continue; // Skip if no meals are available for this category
        }
        // Prefer user favourites and high favouriteCount; then fridge overlap if provided
        const preferFavourites = (candidates: typeof availableMeals) => {
          const sorted = [...candidates].sort((a, b) => {
            const aFav = userFavouriteMealIds.has(a._id) ? 1 : 0;
            const bFav = userFavouriteMealIds.has(b._id) ? 1 : 0;
            if (bFav !== aFav) return bFav - aFav;
            return (b.favouriteCount ?? 0) - (a.favouriteCount ?? 0);
          });
          const topHalf = Math.max(1, Math.ceil(sorted.length * 0.5));
          const pool = sorted.slice(0, topHalf);
          return pool[Math.floor(Math.random() * pool.length)];
        };

        let selectedMeal: (typeof availableMeals)[0];
        if (existingIngredientIds && existingIngredientIds.length > 0) {
          const mealsWithScores = await Promise.all(
            availableMeals.map(async (meal) => {
              const mealIngredients = await ctx.db
                .query("mealIngredients")
                .withIndex("by_meal", (q) => q.eq("mealId", meal._id))
                .collect();
              const matchingCount = mealIngredients.filter(
                (mi) =>
                  mi.ingredientId &&
                  existingIngredientIds.includes(mi.ingredientId),
              ).length;
              return { meal, score: matchingCount };
            }),
          );
          const maxScore = Math.max(...mealsWithScores.map((m) => m.score));
          const bestMeals =
            maxScore > 0
              ? mealsWithScores.filter((m) => m.score === maxScore)
              : mealsWithScores;
          const fridgePool = bestMeals.map((m) => m.meal);
          selectedMeal = preferFavourites(fridgePool);
        } else {
          selectedMeal = preferFavourites(availableMeals);
        }

        await ctx.db.insert("planMeals", {
          planId,
          mealId: selectedMeal._id,
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
    let planId: Id<"plans">;
    const existingPlan = await ctx.db
      .query("plans")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", ctx.user.id as Id<"users">).eq("date", date),
      )
      .first();

    const now = Date.now();
    if (existingPlan) {
      planId = existingPlan._id;
      // Optional: Update the updatedAt timestamp for the meal plan itself
      // await ctx.db.patch(mealPlanId, { updatedAt: now });
    } else {
      // Create a new meal plan if it doesn't exist for this user and date
      planId = await ctx.db.insert("plans", {
        userId: ctx.user.id,
        date,
        createdAt: now,
        updatedAt: now,
      });
      console.log(
        `Created new meal plan ${planId} for user ${ctx.user.id} on date ${new Date(date).toISOString().split("T")[0]}`,
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
    // Since planMeals now has a 'category' field, we can query directly.
    // Note: We need an index on [mealPlanId, category] for this to be efficient.
    // Let's assume we'll add ` .index("by_plan_and_category", ["mealPlanId", "category"])` to planMeals in schema.ts
    const existingPlannedMeal = await ctx.db
      .query("planMeals")
      .withIndex("by_plan_and_category", (q) =>
        q.eq("planId", planId).eq("category", category),
      )
      .first(); // Get the first match (should be unique per plan/category)

    let plannedMealIdToReturn: Id<"planMeals">;

    // 5. --- Update or Insert Planned Meal ---
    if (existingPlannedMeal) {
      // Update the existing planned meal's mealId
      await ctx.db.patch(existingPlannedMeal._id, {
        mealId: newMealId,
        updatedAt: Date.now(),
      });
      plannedMealIdToReturn = existingPlannedMeal._id;
      console.log(
        `Updated planned meal ${existingPlannedMeal._id} for category ${category} in meal plan ${planId}`,
      );
    } else {
      // Insert a new planned meal if none existed for this category
      const newPlannedMealId = await ctx.db.insert("planMeals", {
        planId,
        mealId: newMealId,
        category: category, // Store the category directly
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      plannedMealIdToReturn = newPlannedMealId;
      console.log(
        `Inserted new planned meal ${newPlannedMealId} for category ${category} in meal plan ${planId}`,
      );
    }

    await ShoppingList.generateShoppingList(ctx, { planId });

    // 6. --- Return Result ---
    return { success: true, plannedMealId: plannedMealIdToReturn };
  },
});

export const updatePlanMealScheduledTime = authMutation({
  args: {
    planMealId: v.id("planMeals"),
    scheduledTime: v.string(),
  },
  handler: async (ctx, { planMealId, scheduledTime }) => {
    const planMeal = await ctx.db.get(planMealId);
    if (!planMeal) throw new Error("Planned meal not found.");

    const plan = await ctx.db.get(planMeal.planId);
    if (!plan || plan.userId !== ctx.user.id) {
      throw new Error("Not authorized to update this plan.");
    }

    await ctx.db.patch(planMealId, {
      scheduledTime,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const markPlanMealAsEaten = authMutation({
  args: {
    planMealId: v.id("planMeals"),
    eaten: v.boolean(),
  },
  handler: async (ctx, { planMealId, eaten }) => {
    const planMeal = await ctx.db.get(planMealId);
    if (!planMeal) throw new Error("Planned meal not found.");

    const plan = await ctx.db.get(planMeal.planId);
    if (!plan || plan.userId !== ctx.user.id) {
      throw new Error("Not authorized to update this plan.");
    }

    await ctx.db.patch(planMealId, {
      eatenAt: eaten ? Date.now() : null,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const addPlanExtra = authMutation({
  args: {
    planId: v.id("plans"),
    mealId: v.id("meals"),
    servingAmount: v.optional(v.number()),
  },
  handler: async (ctx, { planId, mealId, servingAmount }) => {
    const plan = await ctx.db.get(planId);
    if (!plan || plan.userId !== ctx.user.id) {
      throw new Error("Plan not found or not authorized.");
    }

    const meal = await ctx.db.get(mealId);
    if (!meal) {
      throw new Error("Meal not found.");
    }

    await ctx.db.insert("planExtras", {
      planId,
      mealId,
      servingAmount,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const removePlanExtra = authMutation({
  args: { planExtraId: v.id("planExtras") },
  handler: async (ctx, { planExtraId }) => {
    const extra = await ctx.db.get(planExtraId);
    if (!extra) throw new Error("Extra not found.");

    const plan = await ctx.db.get(extra.planId);
    if (!plan || plan.userId !== ctx.user.id) {
      throw new Error("Not authorized to remove this extra.");
    }

    await ctx.db.delete(planExtraId);
    return { success: true };
  },
});

export const lockMealPlan = authMutation({
  args: {
    mealPlanId: v.id("plans"),
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
