import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export const INGREDIENT_CATEGORIES = [
  "dairy",
  "meat",
  "poultry",
  "seafood",
  "vegetable",
  "fruit",
  "grain",
  "legume",
  "nut_seed",
  "spice_herb",
  "fat_oil",
  "sweetener",
  "condiment",
  "beverage",
  "baking",
  "other",
] as const;

export const MEAL_CATEGORIES = [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
  "dessert",
] as const;

export const UNITS = [
  "g",
  "kg",
  "ml",
  "l",
  "tsp",
  "tbsp",
  "cup",
  "oz",
  "lb",
  "piece",
  "pinch",
] as const;

export default defineSchema({
  ...authTables,

  profiles: defineTable({
    userId: v.id("users"),
    nickname: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  ingredients: defineTable({
    name: v.string(),
    category: v.union(...INGREDIENT_CATEGORIES.map((c) => v.literal(c))),
    unit: v.union(...UNITS.map((u) => v.literal(u))),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_name", ["name"]),

  meals: defineTable({
    name: v.string(),
    description: v.string(),
    instructions: v.optional(v.string()),
    prepTimeMinutes: v.optional(v.number()),
    cookTimeMinutes: v.optional(v.number()),
    calories: v.optional(v.number()),
    servings: v.optional(v.number()),
    category: v.union(...MEAL_CATEGORIES.map((c) => v.literal(c))),
    imageUrl: v.optional(v.string()),
    isPublic: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_author", ["createdBy"])
    .index("by_category", ["category"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["category"],
    }),

  mealIngredients: defineTable({
    mealId: v.id("meals"),
    ingredientId: v.id("ingredients"),
    quantity: v.number(),
    isOptional: v.boolean(),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_meal", ["mealId"])
    .index("by_ingredient", ["ingredientId"]),

  mealPlans: defineTable({
    userId: v.id("users"),
    date: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_and_date", ["userId", "date"]),

  plannedMeals: defineTable({
    mealPlanId: v.id("mealPlans"),
    mealId: v.id("meals"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_meal_plan", ["mealPlanId"])
    .index("by_meal", ["mealId"]),

  shoppingLists: defineTable({
    userId: v.id("users"),
    weekStart: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_and_week", ["userId", "weekStart"]),

  shoppingListItems: defineTable({
    shoppingListId: v.id("shoppingLists"),
    ingredientId: v.id("ingredients"),
    amount: v.number(),
    isChecked: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_shopping_list", ["shoppingListId"])
    .index("by_ingredient", ["ingredientId"]),
});
