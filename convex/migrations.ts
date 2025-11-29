import { Migrations } from "@convex-dev/migrations";
import { components, internal } from "./_generated/api.js";
import type { DataModel } from "./_generated/dataModel.js";
import { internalMutation } from "./_generated/server";
import { MEAL_CATEGORIES } from "./schema.js";

export const migrations = new Migrations<DataModel>(components.migrations);

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
