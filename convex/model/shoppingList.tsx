import type { Id } from "../_generated/dataModel";
import type { AuthMutationCtx } from "../custom/mutation";

/** Map of ingredientId -> amount user has. Mutated in place as amounts are "used" per day. */
type RemainingIngredients = Map<Id<"ingredients">, number>;

export async function generateShoppingList(
  ctx: AuthMutationCtx,
  {
    planId,
    remainingIngredients,
  }: {
    planId: Id<"plans">;
    remainingIngredients?: RemainingIngredients;
  },
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
    const itemsToInsert: Array<{
      ingredientId: Id<"ingredients">;
      amount: number;
      existingAmountUsed?: number;
    }> = [];

    for (const [ingredientId, needed] of aggregatedIngredients.entries()) {
      let amountToAdd = needed;
      let existingAmountUsed: number | undefined;

      if (remainingIngredients) {
        const has = remainingIngredients.get(ingredientId) ?? 0;
        if (has >= needed) {
          // User has enough - remove from list entirely, subtract from remaining
          remainingIngredients.set(ingredientId, has - needed);
          continue;
        }
        if (has > 0) {
          // Partial - add remainder to list, mark as partial
          amountToAdd = needed - has;
          existingAmountUsed = has;
          remainingIngredients.set(ingredientId, 0);
        }
      }

      itemsToInsert.push({
        ingredientId,
        amount: amountToAdd,
        ...(existingAmountUsed !== undefined && { existingAmountUsed }),
      });
    }

    await Promise.all(
      itemsToInsert.map((item) =>
        ctx.db.insert("shoppingListItems", {
          shoppingListId: currentListId,
          ingredientId: item.ingredientId,
          amount: item.amount,
          isChecked: false,
          ...(item.existingAmountUsed !== undefined && {
            existingAmountUsed: item.existingAmountUsed,
          }),
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

  const now = Date.now();

  return await ctx.db.insert("shoppingLists", {
    userId: ctx.user.id,
    planId,
    date: planDate,
    createdAt: now,
    updatedAt: now,
  });
}
