import { Migrations } from "@convex-dev/migrations";
import { components } from "./_generated/api.js";
import type { DataModel, Id } from "./_generated/dataModel.js";
import { internalMutation } from "./_generated/server";

export const migrations = new Migrations<DataModel>(components.migrations);

export const backfillIngredientNameLower = internalMutation({
  args: {},
  handler: async (ctx) => {
    const ingredients = await ctx.db.query("ingredients").collect();
    let count = 0;

    for (const ing of ingredients) {
      if (!ing.nameLower) {
        await ctx.db.patch(ing._id, {
          nameLower: ing.name.toLowerCase().trim(),
        });
        count++;
      }
    }

    return `Backfilled nameLower for ${count} ingredients.`;
  },
});

export const migrateReplacementsToRatio = internalMutation({
  args: {},
  handler: async (ctx) => {
    let ingredientsCount = 0;
    let mealIngredientsCount = 0;

    // ingredients: replacementIds -> replacements
    const ingredients = await ctx.db.query("ingredients").collect();
    for (const ing of ingredients) {
      const doc = ing as {
        replacementIds?: string[];
        replacements?: { ingredientId: string; ratio: number }[];
      };
      if (
        doc.replacementIds &&
        doc.replacementIds.length > 0 &&
        !doc.replacements
      ) {
        await ctx.db.patch(ing._id, {
          replacements: doc.replacementIds.map((id) => ({
            ingredientId: id as Id<"ingredients">,
            ratio: 1,
          })),
          replacementIds: undefined,
        });
        ingredientsCount++;
      }
    }

    // mealIngredients: allowedReplacementIds -> allowedReplacements
    const mealIngredients = await ctx.db.query("mealIngredients").collect();
    for (const mi of mealIngredients) {
      const doc = mi as {
        allowedReplacementIds?: string[];
        allowedReplacements?: { ingredientId: string; ratio: number }[];
      };
      if (
        doc.allowedReplacementIds &&
        doc.allowedReplacementIds.length > 0 &&
        !doc.allowedReplacements
      ) {
        await ctx.db.patch(mi._id, {
          allowedReplacements: doc.allowedReplacementIds.map((id) => ({
            ingredientId: id as Id<"ingredients">,
            ratio: 1,
          })),
          allowedReplacementIds: undefined,
        });
        mealIngredientsCount++;
      }
    }

    return `Migrated ${ingredientsCount} ingredients and ${mealIngredientsCount} mealIngredients to replacement ratio format.`;
  },
});

export const backfillSearchContent = internalMutation({
  args: {},
  handler: async (ctx) => {
    // 1. Fetch all meals
    const meals = await ctx.db.query("meals").collect();
    let count = 0;

    for (const meal of meals) {
      // 2. Fetch ingredients for this meal
      const mealIngredients = await ctx.db
        .query("mealIngredients")
        .withIndex("by_meal", (q) => q.eq("mealId", meal._id))
        .collect();

      const ingredientNames: string[] = [];

      // 3. Get the actual names
      for (const mi of mealIngredients) {
        if (mi.ingredientId) {
          const ingredient = await ctx.db.get(mi.ingredientId);
          if (ingredient) ingredientNames.push(ingredient.name);
        }
      }

      // 4. Create the search string (Name + Ingredients)
      const searchContent = `${meal.name} ${ingredientNames.join(" ")}`;

      // 5. Update the meal
      await ctx.db.patch(meal._id, { searchContent });
      count++;
    }

    return `Successfully updated ${count} meals with search data.`;
  },
});

// export const transferCategory = migrations.define({
//   table: "meals",
//   migrateOne: async (ctx, doc) => {
//     if (doc.categories === undefined) {
//       const meal = await ctx.db.get(doc._id);
//       await ctx.db.patch(doc._id, {
//         ...meal,
//         categories: [meal?.category ?? MEAL_CATEGORIES[0]],
//       });
//     }
//   },
// });

// export const clearField = migrations.define({
//   table: "meals",
//   migrateOne: () => ({ category: undefined }),
// });

// export const run = migrations.runner([
//   internal.migrations.transferCategory,
//   // internal.migrations.clearField,
// ]);
