import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";
import { authQuery } from "./custom/query";
import { authMutation } from "./custom/mutation";

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
            .gt("date", startDate) // Greater than or equal to the start date timestamp
            .lte("date", endDate), // Less than the end date timestamp
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
    mealPlanId: v.id("mealPlans"),
  },
  handler: async (ctx, { mealPlanId }) => {
    const userId = ctx.user.id;

    const mealPlan = await ctx.db.get(mealPlanId);
    if (!mealPlan) {
      throw new Error(`Meal plan with ID ${mealPlanId} not found.`);
    }
    if (mealPlan.userId !== userId) {
      throw new Error("User does not own the provided meal plan.");
    }
    const mealPlanDate = mealPlan.date; // Get the date from the meal plan

    // 3. Fetch Planned Meals for the specific Meal Plan
    const plannedMeals = await ctx.db
      .query("plannedMeals")
      .withIndex("by_plan_and_category", (q) => q.eq("mealPlanId", mealPlanId))
      .collect();

    if (plannedMeals.length === 0) {
      // No meals planned for this specific meal plan.
      console.log(`No planned meals found for meal plan ${mealPlanId}.`);
      // We will proceed to create an empty shopping list after cleanup.
    }

    // 4. Fetch all unique Meal IDs from the planned meals
    const mealIds = [...new Set(plannedMeals.map((pm) => pm.mealId))];

    // 5. Fetch Meal Ingredients for all meals in the plan
    const allMealIngredients = (
      await Promise.all(
        mealIds.map((id) =>
          ctx.db
            .query("mealIngredients")
            .withIndex("by_meal", (q) => q.eq("mealId", id))
            .collect(),
        ),
      )
    ).flat(); // Flatten the array of arrays

    // 6. Aggregate Ingredients by ID
    const aggregatedIngredients = new Map<Id<"ingredients">, number>();
    for (const mi of allMealIngredients) {
      // Optionally skip optional ingredients
      // if (mi.isOptional) continue;

      const currentAmount = aggregatedIngredients.get(mi.ingredientId) ?? 0;
      aggregatedIngredients.set(mi.ingredientId, currentAmount + mi.quantity);
    }

    // 7. (Step removed as weekStart is no longer used)

    // 8. Delete Existing Shopping List for this specific Meal Plan
    // Use the by_meal_plan index to find the list associated with this meal plan
    const existingList = await ctx.db
      .query("shoppingLists")
      .withIndex("by_meal_plan", (q) => q.eq("mealPlanId", mealPlanId))
      .first(); // Assuming only one shopping list per meal plan

    if (existingList) {
      console.log(
        `Deleting existing shopping list ${existingList._id} for meal plan ${mealPlanId}`,
      );
      // Delete existing items associated with the old list
      const existingItems = await ctx.db
        .query("shoppingListItems")
        .withIndex("by_shopping_list", (q) =>
          q.eq("shoppingListId", existingList._id),
        )
        .collect();
      await Promise.all(existingItems.map((item) => ctx.db.delete(item._id)));

      // Delete the list itself
      await ctx.db.delete(existingList._id);
    }

    // 9. Create New Shopping List linked to the Meal Plan and Date
    const now = Date.now();
    const shoppingListId = await ctx.db.insert("shoppingLists", {
      userId: userId,
      mealPlanId: mealPlanId, // Link to the specific meal plan
      date: mealPlanDate, // Store the date of the meal plan
      createdAt: now,
      updatedAt: now,
    });

    // 10. Create Shopping List Items from Aggregated Ingredients
    await Promise.all(
      Array.from(aggregatedIngredients.entries()).map(
        ([ingredientId, amount]) =>
          ctx.db.insert("shoppingListItems", {
            shoppingListId,
            ingredientId,
            amount,
            isChecked: false, // Default to not checked
            createdAt: now,
            updatedAt: now,
          }),
      ),
    );

    console.log(
      `Generated shopping list ${shoppingListId} for meal plan ${mealPlanId} (Date: ${new Date(
        mealPlanDate,
      ).toDateString()})`,
    );

    return { success: true, shoppingListId };
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
