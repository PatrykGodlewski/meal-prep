import { defineSchema, defineTable } from "convex/server";
import { zodOutputToConvex, zid } from "convex-helpers/server/zod";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";
import { z } from "zod";

export const DEFAULT_INGREDIENT_CATEGORY = "other" as const;
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
  DEFAULT_INGREDIENT_CATEGORY,
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

export const ingredientSchema = z.object({
  name: z.string(),
  category: z.enum(INGREDIENT_CATEGORIES),
  unit: z.enum(UNITS),
  calories: z.number().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const ingredientValidator = zodOutputToConvex(ingredientSchema);

export const mealIngredientsSchema = z.object({
  mealId: zid("meals"),
  ingredientId: zid("ingredients"),
  quantity: z.number(),
  isOptional: z.boolean(),
  notes: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const mealIngredientsValidator = zodOutputToConvex(
  mealIngredientsSchema,
);

export const profileValidator = v.object({
  userId: v.id("users"),
  nickname: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const mealSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  instructions: z.string().optional(),
  prepTimeMinutes: z.number().optional(),
  cookTimeMinutes: z.number().optional(),
  calories: z.number().optional(),
  servings: z.number().optional(),
  category: z.enum(MEAL_CATEGORIES).optional(),
  // TODO: should be required
  categories: z.array(z.enum(MEAL_CATEGORIES)).optional(),
  imageUrl: z.string().optional(),
  isPublic: z.boolean().default(false),
  createdBy: zid("users"),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const mealValidator = zodOutputToConvex(mealSchema);

export const mealPlanValidator = v.object({
  userId: v.id("users"),
  date: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const plannedMealSchema = z.object({
  mealPlanId: zid("mealPlans"),
  mealId: zid("meals"),
  category: z.enum(MEAL_CATEGORIES).optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

const plannedMealValidator = zodOutputToConvex(plannedMealSchema);

export const shoppingListValidator = v.object({
  userId: v.id("users"),
  mealPlanId: v.id("mealPlans"), // Made non-optional
  date: v.number(), // Added date field (timestamp for the day)
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const shoppingListItemValidator = v.object({
  shoppingListId: v.id("shoppingLists"),
  ingredientId: v.id("ingredients"),
  amount: v.number(),
  isChecked: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export default defineSchema({
  ...authTables,

  profiles: defineTable(profileValidator).index("by_user", ["userId"]),

  ingredients: defineTable(ingredientValidator).index("by_name", ["name"]),

  meals: defineTable(mealValidator)
    .index("by_author", ["createdBy"])
    .index("by_categories", ["categories"]) // Renamed index
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["categories"], // Correct filter field
    }),

  mealIngredients: defineTable(mealIngredientsValidator)
    .index("by_meal", ["mealId"])
    .index("by_ingredient", ["ingredientId"]),

  // TODO: change to plans
  mealPlans: defineTable(mealPlanValidator).index("by_user_and_date", [
    "userId",
    "date",
  ]),

  // TODO: change to mealPlanJoin
  plannedMeals: defineTable(plannedMealValidator)
    .index("by_plan_and_category", ["mealPlanId", "category"])
    .index("by_meal", ["mealId"]),

  shoppingLists: defineTable(shoppingListValidator)
    .index("by_user_and_date", ["userId", "date"]) // New index for date range queries
    .index("by_meal_plan", ["mealPlanId"]), // Optional: Index by meal plan ID

  shoppingListItems: defineTable(shoppingListItemValidator)
    .index("by_shopping_list", ["shoppingListId"])
    .index("by_ingredient", ["ingredientId"]),
});
