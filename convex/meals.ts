// convex/meals.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { DataModel, Id } from "./_generated/dataModel";
import { INGREDIENT_CATEGORIES, MEAL_CATEGORIES, UNITS } from "./schema";
import { getAuthUserId } from "@convex-dev/auth/server";
import { NamedTableInfo, paginationOptsValidator, Query } from "convex/server";

export const addMeal = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    instructions: v.optional(v.string()),
    prepTimeMinutes: v.optional(v.number()),
    cookTimeMinutes: v.optional(v.number()),
    servings: v.optional(v.number()),
    category: v.union(...MEAL_CATEGORIES.map((c) => v.literal(c))),
    imageUrl: v.optional(v.string()),
    isPublic: v.boolean(),
    ingredients: v.array(
      v.object({
        id: v.optional(v.string()),
        name: v.optional(v.string()),
        category: v.optional(
          v.union(...INGREDIENT_CATEGORIES.map((c) => v.literal(c))),
        ),
        unit: v.optional(v.union(...UNITS.map((u) => v.literal(u)))),
        quantity: v.number(),
        isOptional: v.optional(v.boolean()),
        notes: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    // 1. Auth
    const userId = await getAuthUserId(ctx); // Use the helper

    // 2. Create meal
    const now = Date.now();
    const mealId = await ctx.db.insert("meals", {
      name: args.name,
      description: args.description,
      instructions: args.instructions,
      prepTimeMinutes: args.prepTimeMinutes,
      cookTimeMinutes: args.cookTimeMinutes,
      servings: args.servings,
      category: args.category,
      imageUrl: args.imageUrl,
      isPublic: args.isPublic,
      createdBy: userId as Id<"users">, // Use userId directly
      createdAt: now,
      updatedAt: now,
    });

    // 3. Add/Update Ingredients and link them via MealIngredients
    await Promise.all(
      args.ingredients.map(async (ing) => {
        let finalIngredientId: Id<"ingredients">; // Variable to hold the correct ID

        if (ing.id) {
          // If an ID is provided, patch the existing ingredient
          finalIngredientId = ing.id as Id<"ingredients">; // Use the provided ID
          await ctx.db.patch(finalIngredientId, {
            // Only update if name/category/unit are actually provided in the input
            // This prevents accidentally overwriting with defaults if not specified
            ...(ing.name && { name: ing.name }),
            ...(ing.category && { category: ing.category }),
            ...(ing.unit && { unit: ing.unit }),
            updatedAt: now, // Always update the timestamp
          });
        } else {
          // If no ID, insert a new ingredient
          finalIngredientId = await ctx.db.insert("ingredients", {
            name: ing.name ?? "Unnamed Ingredient", // Provide a default name
            category: ing.category ?? "other",
            unit: ing.unit ?? "g",
            createdAt: now,
            updatedAt: now,
          });
        }

        // Create the link using the determined finalIngredientId
        return ctx.db.insert("mealIngredients", {
          mealId,
          ingredientId: finalIngredientId, // Use the correct ID here
          quantity: ing.quantity,
          isOptional: ing.isOptional ?? false,
          notes: ing.notes,
          createdAt: now,
          updatedAt: now,
        });
      }),
    );

    return { success: true, mealId };
  },
});

// --- Edit an existing meal ---
export const editMeal = mutation({
  args: {
    mealId: v.id("meals"),
    name: v.string(),
    description: v.string(),
    instructions: v.optional(v.string()),
    prepTimeMinutes: v.optional(v.number()),
    cookTimeMinutes: v.optional(v.number()),
    servings: v.optional(v.number()),
    category: v.union(...MEAL_CATEGORIES.map((c) => v.literal(c))),
    imageUrl: v.optional(v.string()),
    isPublic: v.boolean(),
    ingredients: v.array(
      v.object({
        id: v.optional(v.string()),
        name: v.optional(v.string()),
        category: v.optional(
          v.union(...INGREDIENT_CATEGORIES.map((c) => v.literal(c))),
        ),
        unit: v.optional(v.union(...UNITS.map((u) => v.literal(u)))),
        quantity: v.number(),
        isOptional: v.optional(v.boolean()),
        notes: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    // 1. Auth and ownership checks (as before)
    const identity = await getAuthUserId(ctx);
    if (!identity) throw new Error("Unauthorized");
    const meal = await ctx.db.get(args.mealId);
    if (!meal) throw new Error("Meal not found");
    if (meal.createdBy !== identity) throw new Error("Not your meal");

    // 2. Update meal fields
    const now = Date.now();
    await ctx.db.patch(args.mealId, {
      name: args.name,
      description: args.description,
      instructions: args.instructions,
      prepTimeMinutes: args.prepTimeMinutes,
      cookTimeMinutes: args.cookTimeMinutes,
      servings: args.servings,
      category: args.category,
      imageUrl: args.imageUrl,
      isPublic: args.isPublic,
      updatedAt: now,
    });

    // 3. Remove old mealIngredients
    const oldMealIngredients = await ctx.db
      .query("mealIngredients")
      .withIndex("by_meal", (q) => q.eq("mealId", args.mealId))
      .collect();
    await Promise.all(oldMealIngredients.map((mi) => ctx.db.delete(mi._id)));

    // 4. For each ingredient row, use existing or create new ingredient
    await Promise.all(
      args.ingredients.map(async (ing) => {
        let ingredientId = ing.id;

        if (!ingredientId) {
          ingredientId = await ctx.db.insert("ingredients", {
            name: ing.name ?? "",
            category: ing.category ?? "other",
            unit: ing.unit ?? "g",
            createdAt: now,
            updatedAt: now,
          });
        } else {
          await ctx.db.patch(ingredientId as Id<"ingredients">, {
            name: ing.name ?? "", // Update name if provided
            category: ing.category ?? "other", // Update category if provided
            unit: ing.unit ?? "g", // Update unit if provided
            updatedAt: now, // Update the modification timestamp
          });
        }

        // Create mealIngredient
        await ctx.db.insert("mealIngredients", {
          mealId: args.mealId,
          ingredientId: ingredientId as Id<"ingredients">,
          quantity: ing.quantity,
          isOptional: ing.isOptional ?? false,
          notes: ing.notes,
          createdAt: now,
          updatedAt: now,
        });
      }),
    );

    return { success: true };
  },
});

// --- Delete a meal and its mealIngredients ---
export const deleteMeal = mutation({
  args: { mealId: v.id("meals") },
  handler: async (ctx, { mealId }) => {
    // 1. Auth
    const userId = await getAuthUserId(ctx); // Use the helper

    // 2. Fetch and check ownership
    const meal = await ctx.db.get(mealId);
    if (!meal) throw new Error("Meal not found");
    if (meal.createdBy !== (userId as Id<"users">))
      // Use userId directly
      throw new Error("Not your meal");

    // 3. Delete mealIngredients
    const mealIngredients = await ctx.db
      .query("mealIngredients")
      .withIndex("by_meal", (q) => q.eq("mealId", mealId))
      .collect();
    await Promise.all(mealIngredients.map((mi) => ctx.db.delete(mi._id)));

    // 4. Delete the meal
    await ctx.db.delete(mealId);

    return { success: true };
  },
});

// --- Get a single meal by its ID, including detailed ingredients ---
export const getMeal = query({
  args: { mealId: v.id("meals") },
  handler: async (ctx, { mealId }) => {
    // 1. Fetch the meal document by its ID
    const meal = await ctx.db.get(mealId);

    if (!meal) {
      return null; // Return null if meal not found
    }

    // 2. Fetch associated mealIngredients
    const mealIngredients = await ctx.db
      .query("mealIngredients")
      .withIndex("by_meal", (q) => q.eq("mealId", mealId))
      .collect();

    // 3. Fetch the full ingredient details for each mealIngredient
    const detailedIngredients = await Promise.all(
      mealIngredients.map(async (mi) => {
        const ingredient = await ctx.db.get(mi.ingredientId);
        if (!ingredient) {
          // Handle case where ingredient might be missing (optional, log error, etc.)
          console.error(
            `Ingredient with ID ${mi.ingredientId} not found for meal ${mealId}`,
          );
          // Decide how to handle this: return null, skip, or throw?
          // Returning the mealIngredient without the full ingredient details for now.
          return { ...mi, ingredient: null };
        }
        // Combine mealIngredient info with the full ingredient object
        return { ...mi, ingredient };
      }),
    );

    // 4. Return the meal object augmented with detailed ingredients
    return {
      ...meal,
      mealIngredients: detailedIngredients, // Add the enriched ingredient list
    };
  },
});

export const getMeals = query({
  args: {
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
    filter: v.optional(v.union(...MEAL_CATEGORIES.map((c) => v.literal(c)))),
  },
  handler: async (ctx, { paginationOpts, search = "", filter }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Authentication required");
    }

    const trimmedSearch = search.trim();
    const isSearching = !!trimmedSearch;
    const isFiltering = !!filter;

    if (isSearching) {
      const query = ctx.db
        .query("meals")
        .withSearchIndex("search_name", (q) => {
          if (isFiltering) {
            return q.search("name", trimmedSearch).eq("category", filter);
          }
          return q.search("name", trimmedSearch);
        });

      const results = await query.paginate(
        paginationOpts ?? { numItems: 10, cursor: null },
      );

      return results;
    }

    if (isFiltering) {
      const query = ctx.db
        .query("meals")
        .withIndex("by_category", (q) => q.eq("category", filter));

      const results = await query.paginate(
        paginationOpts ?? { numItems: 10, cursor: null },
      );

      return results;
    }

    const query = ctx.db.query("meals");

    const results = await query.paginate(
      paginationOpts ?? { numItems: 10, cursor: null },
    );

    return results;
  },
});
