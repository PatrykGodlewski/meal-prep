import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { authMutation } from "./custom/mutation";
import { authQuery } from "./custom/query";
import * as ShoppingList from "./model/shoppingList";

export const getShoppingList = authQuery({
  args: { startDate: v.optional(v.number()), endDate: v.optional(v.number()) },
  handler: async (ctx, { startDate, endDate }) => {
    if (!startDate || !endDate)
      throw new Error("Start and end dates are required.");

    const shoppingListsInRange = await ctx.db
      .query("shoppingLists")
      .withIndex(
        "by_user_and_date", // Using the new index
        (q) =>
          q
            .eq("userId", ctx.user.id)
            .gte("date", startDate)
            .lte("date", endDate),
      )
      .collect();

    if (shoppingListsInRange.length === 0) {
      return { items: [] };
    }

    const shoppingListIds = shoppingListsInRange.map((list) => list._id);

    // 4. Fetch all shopping list items for these shopping lists
    const allShoppingListItems = (
      await Promise.all(
        shoppingListIds.map((listId) =>
          ctx.db
            .query("shoppingListItems")
            .withIndex("by_shopping_list", (q) =>
              q.eq("shoppingListId", listId),
            )
            .collect(),
        ),
      )
    ).flat(); // Flatten the array of arrays into a single array

    if (allShoppingListItems.length === 0) {
      return { items: [] };
    }

    // 5. Aggregate items by ingredient ID, including isChecked and existingAmountUsed
    const aggregatedItems = new Map<
      Id<"ingredients">,
      {
        amount: number;
        isChecked: boolean;
        existingAmountUsed: number; // Sum of partial amounts user already had
        originalItemIds: Id<"shoppingListItems">[];
      }
    >();

    for (const item of allShoppingListItems) {
      const existing = aggregatedItems.get(item.ingredientId);
      const itemExisting = item.existingAmountUsed ?? 0;
      if (existing) {
        existing.amount += item.amount;
        existing.isChecked = existing.isChecked && item.isChecked;
        existing.existingAmountUsed += itemExisting;
        existing.originalItemIds.push(item._id);
      } else {
        aggregatedItems.set(item.ingredientId, {
          amount: item.amount,
          isChecked: item.isChecked,
          existingAmountUsed: itemExisting,
          originalItemIds: [item._id],
        });
      }
    }

    // 6. Fetch all unique ingredient details for the aggregated items
    const ingredientIds = Array.from(aggregatedItems.keys());
    const ingredients = await Promise.all(
      ingredientIds.map((id) => ctx.db.get(id)),
    );
    const ingredientsMap = new Map(
      ingredients
        .filter((ing): ing is NonNullable<typeof ing> => ing !== null)
        .map((ing) => [ing._id, ing]),
    );

    // 7. Build meal breakdown for each ingredient (single fetch of plan data)
    const planIds = shoppingListsInRange.map((list) => list.planId);
    const planDetails = await Promise.all(
      planIds.map(async (planId) => {
        const plan = await ctx.db.get(planId);
        if (!plan) return null;
        const planMeals = await ctx.db
          .query("planMeals")
          .withIndex("by_plan_and_category", (q) => q.eq("planId", planId))
          .collect();
        const mealIds = planMeals.map((pm) => pm.mealId);
        const meals = await Promise.all(mealIds.map((id) => ctx.db.get(id)));
        const mealMap = new Map(
          meals
            .filter((m): m is NonNullable<typeof m> => m !== null)
            .map((m) => [m._id, m]),
        );
        const allMealIngredients = (
          await Promise.all(
            mealIds.map((mealId) =>
              ctx.db
                .query("mealIngredients")
                .withIndex("by_meal", (q) => q.eq("mealId", mealId))
                .collect(),
            ),
          )
        ).flat();

        return { plan, planMeals, mealMap, allMealIngredients };
      }),
    );

    // Map ingredientId -> { mealName, category, planDate, quantity }[]
    const ingredientMealBreakdown = new Map<
      Id<"ingredients">,
      { mealName: string; category: string; planDate: number; quantity: number }[]
    >();

    for (const detail of planDetails) {
      if (!detail) continue;
      const { plan, planMeals, mealMap, allMealIngredients } = detail;

      for (const mi of allMealIngredients) {
        if (!mi.ingredientId) continue;
        const planMeal = planMeals.find((pm) => pm.mealId === mi.mealId);
        const meal = mealMap.get(mi.mealId);
        if (!planMeal || !meal) continue;

        const entries = ingredientMealBreakdown.get(mi.ingredientId) ?? [];
        entries.push({
          mealName: meal.name,
          category: planMeal.category ?? "other",
          planDate: plan.date,
          quantity: mi.quantity,
        });
        ingredientMealBreakdown.set(mi.ingredientId, entries);
      }
    }

    // 8. Fetch user's fridge and subtract from displayed amounts.
    // This read makes the query reactive to fridgeItems - when the user adds/removes
    // items in My Fridge, Convex automatically pushes updated results to clients.
    const fridgeItems = await ctx.db
      .query("fridgeItems")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user.id))
      .collect();

    const fridgeByIngredient = new Map<Id<"ingredients">, number>();
    for (const fi of fridgeItems) {
      const current = fridgeByIngredient.get(fi.ingredientId) ?? 0;
      fridgeByIngredient.set(fi.ingredientId, current + fi.amount);
    }

    // 9. Construct the final list, subtracting fridge amounts
    const finalItems = Array.from(aggregatedItems.entries())
      .map(([ingredientId, aggregatedData]) => {
        const fridgeAmount = fridgeByIngredient.get(ingredientId) ?? 0;
        const needed = aggregatedData.amount;
        const remainder = needed - fridgeAmount;

        if (remainder <= 0) {
          return null;
        }

        const ingredient = ingredientsMap.get(ingredientId) || null;
        const mealBreakdown =
          ingredientMealBreakdown.get(ingredientId) ?? [];
        return {
          _id: ingredientId,
          itemIds: aggregatedData.originalItemIds,
          ingredientId: ingredientId,
          amount: remainder,
          isChecked: aggregatedData.isChecked,
          existingAmountUsed:
            fridgeAmount > 0 ? fridgeAmount : aggregatedData.existingAmountUsed > 0
              ? aggregatedData.existingAmountUsed
              : undefined,
          ingredient: ingredient,
          mealBreakdown,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    // 10. Return the aggregated list
    return {
      items: finalItems,
    };
  },
});

export const generateShoppingList = authMutation({
  args: {
    planId: v.id("plans"),
  },
  handler: async (ctx, args) => {
    return await ShoppingList.generateShoppingList(ctx, args);
  },
});

export const updateShoppingListItem = authMutation({
  // Use authMutation for easier user access
  args: {
    // Accept an array of item IDs instead of a single ID
    shoppingListItemIds: v.array(v.id("shoppingListItems")),
    checked: v.boolean(),
  },
  handler: async (ctx, { checked, shoppingListItemIds }) => {
    const userId = ctx.user.id; // User ID from authMutation context

    if (shoppingListItemIds.length === 0) {
      // Nothing to update
      return { success: true };
    }

    // --- Ownership Check (Optimized) ---
    // Fetch the first item to verify ownership. Assume all items in the array
    // belong to the same user since they come from the aggregated list.
    const firstItemId = shoppingListItemIds[0];
    const firstItem = await ctx.db.get(firstItemId);
    if (!firstItem) {
      // Handle case where the first item might not exist (e.g., deleted)
      // Depending on desired behavior, you could throw, log, or filter out invalid IDs.
      // For now, let's throw an error as it indicates a potential inconsistency.
      throw new Error(`Shopping list item with ID ${firstItemId} not found.`);
    }

    // Fetch the parent shopping list of the first item
    const shoppingList = await ctx.db.get(firstItem.shoppingListId);
    if (!shoppingList) {
      // This case should ideally not happen if data integrity is maintained
      throw new Error(
        `Parent shopping list not found for item ${firstItemId}.`,
      );
    }
    // Verify the user owns the shopping list
    if (shoppingList.userId !== userId) {
      throw new Error(
        "You do not have permission to update items in this shopping list.",
      );
    }
    // --- End Ownership Check ---

    // Update all specified items concurrently
    const now = Date.now();
    await Promise.all(
      shoppingListItemIds.map((itemId) =>
        ctx.db.patch(itemId, {
          isChecked: checked,
          updatedAt: now,
        }),
      ),
    );

    return { success: true };
  },
});
