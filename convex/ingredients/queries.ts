import { v } from "convex/values";
import { authQuery } from "../custom/query";

export const findIngredientByName = authQuery({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    return await ctx.db
      .query("ingredients")
      .withIndex("by_name", (q) => q.eq("name", name))
      .first();
  },
});

export const getIngredients = authQuery({
  args: {},
  handler: async (ctx) => ctx.db.query("ingredients").collect(),
});
