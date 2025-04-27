import { Migrations } from "@convex-dev/migrations";
import { components, internal } from "./_generated/api.js";
import type { DataModel } from "./_generated/dataModel.js";
import { MEAL_CATEGORIES } from "./schema.js";

export const migrations = new Migrations<DataModel>(components.migrations);

export const transferCategory = migrations.define({
  table: "meals",
  migrateOne: async (ctx, doc) => {
    if (doc.categories === undefined) {
      const meal = await ctx.db.get(doc._id);
      await ctx.db.patch(doc._id, {
        ...meal,
        categories: [meal?.category ?? MEAL_CATEGORIES[0]],
      });
    }
  },
});

// export const clearField = migrations.define({
//   table: "meals",
//   migrateOne: () => ({ category: undefined }),
// });

export const run = migrations.runner([
  internal.migrations.transferCategory,
  // internal.migrations.clearField,
]);
