import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";

export const getWeeklyShoppingList = query({
  args: { weekStart: v.number() }, // Expecting a timestamp (milliseconds since epoch)
  handler: async (ctx, { weekStart }) => {
    // 1. Get user identity
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User must be authenticated to fetch shopping lists.");
    }

    // 2. Find the shopping list for this user and week
    const shoppingList = await ctx.db
      .query("shoppingLists")
      .withIndex("by_user_and_week", (q) =>
        q.eq("userId", userId).eq("weekStart", weekStart),
      )
      .first();

    if (!shoppingList) {
      // Optionally, you could return an empty list or throw
      return null;
    }

    // 3. Fetch all shopping list items for this shopping list
    const shoppingListItems = await ctx.db
      .query("shoppingListItems")
      .withIndex("by_shopping_list", (q) =>
        q.eq("shoppingListId", shoppingList._id),
      )
      .collect();

    // 4. Fetch all ingredient details in one go
    const ingredientIds = shoppingListItems.map((item) => item.ingredientId);
    const ingredients = await Promise.all(
      ingredientIds.map((id) => ctx.db.get(id)),
    );

    // 5. Attach ingredient data to each shopping list item
    const itemsWithIngredients = shoppingListItems.map((item) => ({
      ...item,
      ingredient:
        ingredients.find((ing) => ing && ing._id === item.ingredientId) || null,
    }));

    // 6. Return the shopping list with items and ingredient details
    return {
      ...shoppingList,
      items: itemsWithIngredients,
    };
  },
});

export const generateShoppingList = mutation({
  // Accept an array of meal plan IDs and the week start timestamp
  args: {
    mealPlanIds: v.array(v.id("mealPlans")),
    weekStart: v.number(), // Timestamp for the start of the week
  },
  handler: async (ctx, { mealPlanIds, weekStart }) => {
    // 1. Authentication
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error(
        "User must be authenticated to generate a shopping list.",
      );
    }

    // 2. Fetch Meal Plans and check ownership
    if (mealPlanIds.length === 0) {
      // Handle the case where no meal plans are provided, maybe create an empty list or return early
      console.log("No meal plan IDs provided for shopping list generation.");
      // Let's create an empty list in this case after cleaning up any old one.
    } else {
      const mealPlans = await Promise.all(
        mealPlanIds.map((id) => ctx.db.get(id)),
      );
      for (const mealPlan of mealPlans) {
        if (!mealPlan) {
          // Handle case where a meal plan ID is invalid
          // Depending on requirements, you might throw, skip, or log
          console.warn(`Meal plan with ID ${mealPlan} not found.`);
          throw new Error("One or more meal plans not found.");
        }
        if (mealPlan.userId !== userId) {
          throw new Error("User does not own all provided meal plans.");
        }
        // Optional: Check if the meal plan dates actually fall within the weekStart week?
        // This might be overly strict if generatePlanAndShoppingList ensures consistency.
      }
    }

    // 3. Fetch Planned Meals for ALL provided Meal Plans
    const allPlannedMeals = (
      await Promise.all(
        mealPlanIds.map((id) =>
          ctx.db
            .query("plannedMeals")
            .withIndex("by_meal_plan", (q) => q.eq("mealPlanId", id))
            .collect(),
        ),
      )
    ).flat(); // Flatten the array of arrays

    if (allPlannedMeals.length === 0) {
      // No meals planned across all provided meal plans.
      console.log("No planned meals found for the provided meal plans.");
      // We will proceed to create an empty shopping list after cleanup.
    }

    // 4. Fetch all unique Meal IDs from all planned meals
    const mealIds = [...new Set(allPlannedMeals.map((pm) => pm.mealId))];

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

    // 7. Use the provided weekStart timestamp directly
    const weekStartTimestamp = weekStart; // Use the argument

    // 8. Delete Existing Shopping List for this User and Week
    const existingList = await ctx.db
      .query("shoppingLists")
      .withIndex("by_user_and_week", (q) =>
        q.eq("userId", userId).eq("weekStart", weekStartTimestamp),
      )
      .first();

    if (existingList) {
      console.log(
        `Deleting existing shopping list ${existingList._id} for week ${weekStartTimestamp}`,
      );
      // Delete existing items
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

    // 9. Create New Shopping List
    const now = Date.now();
    const shoppingListId = await ctx.db.insert("shoppingLists", {
      userId: userId,
      weekStart: weekStartTimestamp,
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
      `Generated shopping list ${shoppingListId} for week ${weekStartTimestamp}`,
    );

    return { success: true, shoppingListId };
  },
});

export const updateShoppingListItem = mutation({
  args: {
    shoppingListItemId: v.id("shoppingListItems"),
    checked: v.boolean(),
  },
  handler: async (ctx, { checked, shoppingListItemId }) => {
    // 1. Authentication
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error(
        "User must be authenticated to update shopping list items.",
      );
    }

    // 2. Fetch the shopping list item
    const item = await ctx.db.get(shoppingListItemId);
    if (!item) {
      throw new Error("Shopping list item not found.");
    }

    // 3. Fetch the parent shopping list to check ownership
    const shoppingList = await ctx.db.get(item.shoppingListId);
    if (!shoppingList) {
      throw new Error("Parent shopping list not found.");
    }
    if (shoppingList.userId !== userId) {
      throw new Error("You do not have permission to update this item.");
    }

    // 4. Update the isChecked field
    await ctx.db.patch(shoppingListItemId, {
      isChecked: checked,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
