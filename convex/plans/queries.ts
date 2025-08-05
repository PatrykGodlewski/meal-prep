import { v } from "convex/values";
import { addDays } from "date-fns";
import { authQuery } from "../custom/query";
import { MEAL_CATEGORIES } from "../schema";

export const getPlan = authQuery({
  args: { mealPlanId: v.id("plans") },
  handler: async (ctx, { mealPlanId: planId }) => {
    const mealPlan = await ctx.db.get(planId);

    if (!mealPlan) {
      return null;
    }

    const planMeals = await ctx.db
      .query("planMeals")
      // TODO: use both category and meal pland id if possible and necessary
      .withIndex("by_plan_and_category", (q) => q.eq("planId", planId))
      .collect();

    const mealIds = planMeals.map((pm) => pm.mealId);

    const meals = (
      await Promise.all(mealIds.map((id) => ctx.db.get(id)))
    ).filter((meal): meal is NonNullable<typeof meal> => meal !== null);

    const mealMap = new Map(meals.map((meal) => [meal._id, meal]));

    const planMealsWithDetails = planMeals.map((pm) => ({
      ...pm,
      meal: mealMap.get(pm.mealId) || null,
    }));

    return {
      mealPlan,
      planMeals: planMealsWithDetails,
    };
  },
});

export const getPlans = authQuery({
  handler: async (ctx) => {
    const plans = await ctx.db
      .query("plans")
      .withIndex("by_user_and_date", (q) => q.eq("userId", ctx.user.id))
      .collect();

    return plans;
  },
});

export const getWeeklyPlan = authQuery({
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
        // Fetch planMeals for this mealPlan
        const planMeals = await ctx.db
          .query("planMeals")
          // TODO: use both category and meal pland id if possible and necessary
          .withIndex("by_plan_and_category", (q) =>
            q.eq("planId", mealPlan._id),
          )
          .collect();

        // Fetch all mealIds for this mealPlan
        const mealIds = planMeals.map((pm) => pm.mealId);

        // Fetch all meals in one go (batch)
        const meals = await Promise.all(mealIds.map((id) => ctx.db.get(id)));

        // Attach meal data to each planMeal
        const planMealsWithMeal = planMeals.map((pm) => ({
          ...pm,
          meal: meals.find((m) => m && m._id === pm.mealId) || null,
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
        };
      }),
    );

    // 5. Return the combined data
    return results;
  },
});
