import type { Id } from "../_generated/dataModel";
import type { AuthMutationCtx } from "../custom/mutation";

export async function generateShoppingList(
  ctx: AuthMutationCtx,
  { mealPlanId }: { mealPlanId: Id<"mealPlans"> },
) {
  try {
    const userId = ctx.user.id;
    const mealPlan = await ctx.db.get(mealPlanId);

    if (!mealPlan) {
      throw new Error(`Meal plan with ID ${mealPlanId} not found.`);
    }

    if (mealPlan.userId !== userId) {
      throw new Error("User does not own the provided meal plan.");
    }

    const mealPlanDate = mealPlan.date;

    const plannedMeals = await ctx.db
      .query("plannedMeals")
      .withIndex("by_plan_and_category", (q) => q.eq("mealPlanId", mealPlanId))
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
      mealPlanId,
      mealPlanDate,
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
      `Generated shopping list ${currentListId} for meal plan ${mealPlanId} (Date: ${new Date(
        mealPlanDate,
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
  {
    mealPlanId,
    mealPlanDate,
  }: { mealPlanId: Id<"mealPlans">; mealPlanDate: number },
) {
  const existingList = await ctx.db
    .query("shoppingLists")
    .withIndex("by_meal_plan", (q) => q.eq("mealPlanId", mealPlanId))
    .first();

  if (existingList) return existingList._id;

  const now = new Date().getTime();

  return await ctx.db.insert("shoppingLists", {
    userId: ctx.user.id,
    mealPlanId: mealPlanId,
    date: mealPlanDate,
    createdAt: now,
    updatedAt: now,
  });
}
