import type { Id } from "../_generated/dataModel";
import type { AuthMutationCtx } from "../custom/mutation";

export async function generateShoppingList(
  ctx: AuthMutationCtx,
  { planId }: { planId: Id<"plans"> },
) {
  try {
    const userId = ctx.user.id;
    const mealPlan = await ctx.db.get(planId);

    if (!mealPlan) {
      throw new Error(`Meal plan with ID ${planId} not found.`);
    }

    if (mealPlan.userId !== userId) {
      throw new Error("User does not own the provided meal plan.");
    }

    const planDate = mealPlan.date;

    const plannedMeals = await ctx.db
      .query("planMeals")
      .withIndex("by_plan_and_category", (q) => q.eq("planId", planId))
      .collect();

    const mealIds = [...new Set(plannedMeals.map((pm) => pm.mealId))];

    const allMealIngredients = (
      await Promise.all(
        mealIds.map((id) =>
          ctx.db
            .query("mealIngredients")
            .withIndex("by_meal", (q) => q.eq("mealId", id))
            .collect(),
        ),
      )
    ).flat();

    const aggregatedIngredients = new Map<Id<"ingredients">, number>();
    for (const mi of allMealIngredients) {
      // Optionally skip optional ingredients
      if (!mi.ingredientId) continue;

      const currentAmount = aggregatedIngredients.get(mi.ingredientId) ?? 0;
      aggregatedIngredients.set(mi.ingredientId, currentAmount + mi.quantity);
    }

    const currentListId = await upsertShoppingList(ctx, {
      planId,
      planDate,
    });

    const existingItems = await ctx.db
      .query("shoppingListItems")
      .withIndex("by_shopping_list", (q) =>
        q.eq("shoppingListId", currentListId),
      )
      .collect();

    await Promise.all(existingItems.map((item) => ctx.db.delete(item._id)));

    const now = Date.now();

    await Promise.all(
      Array.from(aggregatedIngredients.entries()).map(
        ([ingredientId, amount]) =>
          ctx.db.insert("shoppingListItems", {
            shoppingListId: currentListId,
            ingredientId,
            amount,
            isChecked: false,
            createdAt: now,
            updatedAt: now,
          }),
      ),
    );

    console.log(
      `Generated shopping list ${currentListId} for meal plan ${planId} (Date: ${new Date(
        planDate,
      ).toDateString()})`,
    );

    return { success: true, shoppingListId: currentListId };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "error",
    };
  }
}

export async function upsertShoppingList(
  ctx: AuthMutationCtx,
  { planId, planDate }: { planId: Id<"plans">; planDate: number },
) {
  const existingList = await ctx.db
    .query("shoppingLists")
    .withIndex("by_plan", (q) => q.eq("planId", planId))
    .first();

  if (existingList) return existingList._id;

  const now = new Date().getTime();

  return await ctx.db.insert("shoppingLists", {
    userId: ctx.user.id,
    planId,
    date: planDate,
    createdAt: now,
    updatedAt: now,
  });
}
