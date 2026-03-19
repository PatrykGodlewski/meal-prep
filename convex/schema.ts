import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { zid, zodOutputToConvex } from "convex-helpers/server/zod";
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
  "drinks",
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

// Onboarding / user preferences enums
export const STRICT_DIETS = [
  "vegan",
  "vegetarian",
  "keto",
  "paleo",
  "mediterranean",
  "low_carb",
  "halal",
  "kosher",
  "none",
] as const;
export const ALLERGIES = [
  "peanuts",
  "tree_nuts",
  "shellfish",
  "fish",
  "gluten",
  "dairy",
  "eggs",
  "soy",
  "sesame",
  "none",
] as const;
export const ACTIVITY_LEVELS = [
  "sedentary",
  "light",
  "moderate",
  "active",
  "very_active",
] as const;
export const PRIMARY_GOALS = [
  "weight_loss",
  "maintenance",
  "muscle_gain",
] as const;
export const COOKING_SKILLS = ["beginner", "intermediate", "advanced"] as const;
export const BUDGET_TIERS = ["cheap", "moderate", "premium"] as const;
export const MAX_COOKING_TIME_OPTIONS = [15, 30, 45, 60, 90] as const;
export const INGREDIENT_PREFERENCE_TYPES = [
  "always_include",
  "never_include",
] as const;

/** Food/dish types for preferences – e.g. "I like salads but not creamy soups". */
export const DISH_TYPES = [
  "soup",
  "salad",
  "stir_fry",
  "casserole",
  "roasted",
  "grilled",
  "baked",
  "stew",
  "curry",
  "raw",
  "fried",
  "sandwich_wrap",
  "bowl",
  "none",
] as const;

export const ingredientSchema = z.object({
  name: z.string(),
  nameLower: z.string().optional(), // For case-insensitive deduplication
  category: z.enum(INGREDIENT_CATEGORIES),
  unit: z.enum(UNITS),
  calories: z.number().optional(),
  /** Default replacement ingredients with ratio (e.g. onion -> red onion 1:1, banana->apple 1.2:1). ratio = replacement qty per 1 unit original. */
  replacements: z
    .array(z.object({ ingredientId: zid("ingredients"), ratio: z.number().optional() }))
    .optional(),
  /** @deprecated use replacements. Kept for migration. */
  replacementIds: z.array(zid("ingredients")).optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const ingredientValidator = zodOutputToConvex(ingredientSchema);

export const mealIngredientsSchema = z.object({
  mealId: zid("meals"),
  ingredientId: zid("ingredients").optional(),
  quantity: z.number(),
  isOptional: z.boolean(),
  notes: z.string().optional(),
  /** Override ingredient replacements for this meal (undefined = use default, [] = none). ratio = replacement qty per 1 unit original. */
  allowedReplacements: z
    .array(z.object({ ingredientId: zid("ingredients"), ratio: z.number().optional() }))
    .optional(),
  /** @deprecated use allowedReplacements. Kept for migration. */
  allowedReplacementIds: z.array(zid("ingredients")).optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const mealIngredientsValidator = zodOutputToConvex(
  mealIngredientsSchema,
);

export const profileValidator = v.object({
  userId: v.id("users"),
  settings: v.object({
    servings: v.number(),
  }),
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
  categories: z.array(z.enum(MEAL_CATEGORIES)),
  imageUrl: z.string().optional(),
  isPublic: z.boolean().default(false),
  searchContent: z.string().optional(),
  /** Diet tags for hard filtering (vegan, keto, etc.). Indexed for planner. */
  strictDietTags: z.array(z.string()).optional(),
  /** Allergens present in this recipe (e.g. dairy, gluten). For safety filtering. */
  allergens: z.array(z.string()).optional(),
  /** Community rating 0–5. Used as base score in planner (e.g. 4.5 → 45 points). */
  communityRating: z.number().min(0).max(5).optional(),
  /** Denormalized count of users who favourited this meal. Updated on add/remove favourite. */
  favouriteCount: z.number().optional(),
  /** Embedding vector for semantic search (768 dims, Google gemini-embedding-001). */
  embedding: z.optional(z.array(z.number())),
  createdBy: zid("users"),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const mealValidator = zodOutputToConvex(mealSchema);

/** User favouriting a meal (one row per user–meal pair). */
export const mealFavouritesValidator = v.object({
  userId: v.id("users"),
  mealId: v.id("meals"),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const planSchema = z.object({
  userId: zid("users"),
  date: z.number(),
  locked: z.boolean().optional().default(false),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const planValidator = zodOutputToConvex(planSchema);

export const planMealsSchema = z.object({
  planId: zid("plans"),
  mealId: zid("meals"),
  servingAmount: z.number().optional(),
  category: z.enum(MEAL_CATEGORIES).optional(),
  eatenAt: z.number().optional().nullable(), // timestamp when user marked meal as eaten
  scheduledTime: z.string().optional(), // e.g. "12:00" when meal should be eaten
  createdAt: z.number(),
  updatedAt: z.number(),
});

const planMealsValidator = zodOutputToConvex(planMealsSchema);

/** Extra items from existing meals (e.g. coffee with milk) - always count as eaten */
export const planExtrasSchema = z.object({
  planId: zid("plans"),
  mealId: zid("meals"),
  servingAmount: z.number().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

const planExtrasValidator = zodOutputToConvex(planExtrasSchema);

export const shoppingListValidator = v.object({
  userId: v.id("users"),
  planId: v.id("plans"),
  date: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const shoppingListItemValidator = v.object({
  shoppingListId: v.id("shoppingLists"),
  ingredientId: v.id("ingredients"),
  amount: v.number(),
  isChecked: v.boolean(),
  /** Amount user already had (partial) - triggers warning to buy only remainder */
  existingAmountUsed: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

// User preferences for onboarding (resumable, ML-ready)
export const userPreferencesValidator = v.object({
  userId: v.id("users"),
  onboardingStep: v.number(), // 0-5; 0=not started, 1-5=completed step
  onboardingCompleted: v.boolean(),
  biometrics: v.optional(
    v.object({
      age: v.number(),
      gender: v.optional(v.string()),
      heightCm: v.optional(v.number()),
      weightKg: v.optional(v.number()),
      activityLevel: v.optional(v.string()),
      primaryGoal: v.optional(v.string()),
    }),
  ),
  dietary: v.optional(
    v.object({
      strictDiets: v.array(v.string()),
      allergies: v.array(v.string()),
    }),
  ),
  logistics: v.optional(
    v.object({
      mealsPerDay: v.optional(v.number()),
      snacksPerDay: v.optional(v.number()),
      maxCookingTimeMins: v.optional(v.number()),
      cookingSkillLevel: v.optional(v.string()),
      budgetTier: v.optional(v.string()),
    }),
  ),
  appetite: v.optional(
    v.object({
      prefersMealPrep: v.optional(v.boolean()),
    }),
  ),
  /** Preferred / avoided dish types – e.g. salads vs soups, not strict ingredients. */
  dishTypes: v.optional(
    v.object({
      preferredTypes: v.array(v.string()),
      avoidedTypes: v.array(v.string()),
    }),
  ),
  /** ML-adjustable ingredient weights for scoring. Key = ingredient Id (string), value = weight (e.g. 5 = prefer, -2 = avoid). */
  ingredientWeights: v.optional(v.record(v.string(), v.number())),
  createdAt: v.number(),
  updatedAt: v.number(),
});

// Ingredient preferences (Always Include / Never Include) with ML-ready scoring
export const ingredientPreferenceValidator = v.object({
  userId: v.id("users"),
  ingredientId: v.id("ingredients"),
  preferenceType: v.union(
    v.literal("always_include"),
    v.literal("never_include"),
  ),
  score: v.number(), // future AI adjusts; + for include, - for exclude
  createdAt: v.number(),
  updatedAt: v.number(),
});

export default defineSchema({
  ...authTables,

  profiles: defineTable(profileValidator).index("by_user", ["userId"]),

  ingredients: defineTable(ingredientValidator)
    .index("by_name", ["name"])
    .index("by_name_lower", ["nameLower"])
    .searchIndex("search_name", { searchField: "name" }),

  meals: defineTable(mealValidator)
    .index("by_author", ["createdBy"])
    .index("by_categories", ["categories"])
    .index("by_strict_diet", ["strictDietTags"])
    .index("by_favourite_count", ["favouriteCount"])
    .searchIndex("search_name", {
      searchField: "searchContent",
      filterFields: ["categories"],
    })
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 768,
    }),

  mealFavourites: defineTable(mealFavouritesValidator)
    .index("by_user", ["userId"])
    .index("by_meal", ["mealId"])
    .index("by_user_and_meal", ["userId", "mealId"]),

  /** Meal generation requests – workflow: mutation creates request, schedules action, action writes result. */
  mealGenerationRequests: defineTable({
    userId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    prompt: v.string(),
    planId: v.optional(v.id("plans")),
    date: v.optional(v.number()),
    mealId: v.optional(v.id("meals")),
    result: v.optional(v.any()),
    error: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_created", ["userId", "createdAt"]),

  mealIngredients: defineTable(mealIngredientsValidator)
    .index("by_meal", ["mealId"])
    .index("by_ingredient", ["ingredientId"]),

  plans: defineTable(planValidator).index("by_user_and_date", [
    "userId",
    "date",
  ]),

  planMeals: defineTable(planMealsValidator)
    .index("by_plan_and_category", ["planId", "category"])
    .index("by_meal", ["mealId"]),

  planExtras: defineTable(planExtrasValidator).index("by_plan", ["planId"]),

  shoppingLists: defineTable(shoppingListValidator)
    .index("by_user_and_date", ["userId", "date"]) // New index for date range queries
    .index("by_plan", ["planId"]), // Optional: Index by meal plan ID

  shoppingListItems: defineTable(shoppingListItemValidator)
    .index("by_shopping_list", ["shoppingListId"])
    .index("by_ingredient", ["ingredientId"]),

  /** User's fridge - ingredients they have at home. Shopping list subtracts these. */
  fridgeItems: defineTable({
    userId: v.id("users"),
    ingredientId: v.id("ingredients"),
    amount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_ingredient", ["userId", "ingredientId"]),

  userPreferences: defineTable(userPreferencesValidator)
    .index("by_user", ["userId"]),

  ingredientPreferences: defineTable(ingredientPreferenceValidator)
    .index("by_user_and_type", ["userId", "preferenceType"])
    .index("by_user_and_ingredient", ["userId", "ingredientId"]),

  /** Plan generation requests – workflow: mutation creates request, schedules action, action writes result. App queries this. */
  planGenerationRequests: defineTable({
    userId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    result: v.optional(
      v.array(
        v.object({
          mealId: v.id("meals"),
          matchScore: v.number(),
          meal: v.object({
            _id: v.id("meals"),
            name: v.string(),
            categories: v.array(v.string()),
            prepTimeMinutes: v.optional(v.number()),
            cookTimeMinutes: v.optional(v.number()),
            communityRating: v.optional(v.number()),
            imageUrl: v.optional(v.string()),
          }),
        }),
      ),
    ),
    error: v.optional(v.string()),
    limit: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_created", ["userId", "createdAt"]),

  /** Personalized diet – one per user, overwritten on regenerate. */
  personalizedDiets: defineTable({
    userId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    result: v.optional(v.any()),
    error: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),
});
