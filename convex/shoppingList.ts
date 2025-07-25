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

    // 5. Aggregate items by ingredient ID, including isChecked status
    const aggregatedItems = new Map<
      Id<"ingredients">,
      {
        amount: number;
        isChecked: boolean; // Add isChecked status
        originalItemIds: Id<"shoppingListItems">[];
      }
    >();

    for (const item of allShoppingListItems) {
      const existing = aggregatedItems.get(item.ingredientId);
      if (existing) {
        existing.amount += item.amount;
        // Aggregate is checked ONLY if ALL underlying items are checked
        existing.isChecked = existing.isChecked && item.isChecked; // Use AND logic
        existing.originalItemIds.push(item._id);
      } else {
        aggregatedItems.set(item.ingredientId, {
          amount: item.amount,
          isChecked: item.isChecked, // Initialize with the first item's status
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

    // 7. Construct the final list with aggregated amounts and ingredient details
    const finalItems = Array.from(aggregatedItems.entries()).map(
      ([ingredientId, aggregatedData]) => {
        const ingredient = ingredientsMap.get(ingredientId) || null;
        // We return the aggregated amount and ingredient details.
        // We also include originalItemIds if needed downstream, but omit isChecked.
        return {
          _id: ingredientId, // Use ingredientId as a stable key for the aggregated item
          itemIds: aggregatedData.originalItemIds,
          ingredientId: ingredientId,
          amount: aggregatedData.amount,
          isChecked: aggregatedData.isChecked, // Include the aggregated checked status
          ingredient: ingredient,
          // Note: isChecked is omitted as it's ambiguous in aggregation
          // originalItemIds: aggregatedData.originalItemIds, // Optionally include if needed
        };
      },
    );

    // 8. Return the aggregated list
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
