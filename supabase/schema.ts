import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
  primaryKey,
  pgSchema,
  serial,
  date,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

const authSchema = pgSchema("auth");

// --- ENUMS ---

export const MEAL_CATEGORY_ENUM = pgEnum("meal_category", [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
]);

export const UNIT_ENUM = pgEnum("unit", [
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
]);

export const INGREDIENT_CATEGORY_ENUM = pgEnum("ingredient_category", [
  "dairy",
  "meat",
  "poultry",
  "seafood",
  "vegetable",
  "fruit",
  "grain", // Includes flour, pasta, rice etc.
  "legume", // Beans, lentils, peas
  "nut_seed",
  "spice_herb",
  "fat_oil",
  "sweetener",
  "condiment", // Sauces, vinegar etc.
  "beverage",
  "baking", // Baking powder, yeast etc.
  "other",
]);

// --- TABLES ---

export const users = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  nickname: text("nickname"),
});

export const meals = pgTable("meals", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  instructions: text("instructions"),
  prepTimeMinutes: integer("prep_time_minutes"),
  cookTimeMinutes: integer("cook_time_minutes"),
  servings: integer("servings"),
  category: MEAL_CATEGORY_ENUM("category"),
  imageUrl: text("image_url"),
  isPublic: boolean("is_public").default(false),
  createdBy: uuid("created_by").references(() => users.id, {
    onDelete: "cascade",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const mealPlans = pgTable("meal_plans", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  date: date("date").notNull(),
});

export const plannedMeals = pgTable(
  "planned_meals",
  {
    mealPlanId: integer("meal_plan_id")
      .references(() => mealPlans.id, { onDelete: "cascade" }) // Added onDelete
      .notNull(),
    mealId: uuid("meal_id")
      .references(() => meals.id, { onDelete: "cascade" }) // Added onDelete
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.mealPlanId, table.mealId],
    }), // Added category to PK if one meal can be planned multiple times per day under different categories
    // If a meal can only appear once per day plan, use:
    // pk_planned_meals: primaryKey({ columns: [table.mealPlanId, table.mealId] }),
  ],
);

// --- Independent Ingredients Table ---
export const ingredients = pgTable("ingredients", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  name: text("name").notNull().unique(), // Each ingredient name should be unique
  category: INGREDIENT_CATEGORY_ENUM("category"), // Required or notNull, based on your requirements
  unit: UNIT_ENUM("unit"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// --- Junction Table: Many-to-Many Relation Between Meals and Ingredients ---
export const mealIngredients = pgTable(
  "meal_ingredients",
  {
    mealId: uuid("meal_id")
      .notNull()
      .references(() => meals.id, { onDelete: "cascade" }),
    ingredientId: uuid("ingredient_id")
      .notNull()
      .references(() => ingredients.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(), // Specific quantity for this meal
    isOptional: boolean("is_optional").default(false),
    notes: text("notes"),
  },
  (table) => [
    primaryKey({
      columns: [table.mealId, table.ingredientId],
    }),
  ],
);

export const tags = pgTable("tags", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const mealsTags = pgTable(
  "meals_tags",
  {
    mealId: uuid("meal_id")
      .notNull()
      .references(() => meals.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.mealId, table.tagId] })],
);

export const shoppingLists = pgTable("shopping_lists", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  mealPlanWeekStart: date("meal_plan_week_start"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// New junction table for items within a shopping list
export const shoppingListItems = pgTable(
  "shopping_list_items",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(), // Unique ID for the list item itself
    shoppingListId: uuid("shopping_list_id")
      .references(() => shoppingLists.id, { onDelete: "cascade" })
      .notNull(),
    // Store ingredient details directly or reference an ingredient ID
    // ingredientName: text("ingredient_name").notNull(),
    amount: integer("amount"), // Store the formatted amount string
    ingredientId: uuid("ingredient_id").references(() => ingredients.id), // Optional: Link to definition
    ingredientName: text("ingredient_name").references(() => ingredients.name),
    isChecked: boolean("is_checked").default(false).notNull(),
    // Optional: Track who checked it and when
    // checkedBy: uuid("checked_by").references(() => users.id),
    // checkedAt: timestamp("checked_at", { withTimezone: true }),
  },
  (table) => [
    // Prevent duplicate ingredient names within the same list (optional but recommended)
    uniqueIndex("uq_list_ingredient").on(
      table.shoppingListId,
      table.ingredientId,
    ),
  ],
);

// --- RELATIONS ---

export const shoppingListsRelations = relations(
  shoppingLists,
  ({ one, many }) => ({
    user: one(users, {
      fields: [shoppingLists.userId],
      references: [users.id],
    }),
    items: many(shoppingListItems),
  }),
);

export const shoppingListItemsRelations = relations(
  shoppingListItems,
  ({ one }) => ({
    shoppingList: one(shoppingLists, {
      fields: [shoppingListItems.shoppingListId],
      references: [shoppingLists.id],
    }),
    ingredient: one(ingredients, {
      fields: [shoppingListItems.ingredientId],
      references: [ingredients.id],
    }),
  }),
);

export const mealsRelations = relations(meals, ({ many, one }) => ({
  mealIngredients: many(mealIngredients), // Relation to the junction table
  tags: many(mealsTags),
  plannedMeals: many(plannedMeals),
  user: one(users, {
    fields: [meals.createdBy],
    references: [users.id],
  }),
}));

export const ingredientsRelations = relations(ingredients, ({ many }) => ({
  mealIngredients: many(mealIngredients), // Relation to the junction table
}));

export const mealIngredientsRelations = relations(
  mealIngredients,
  ({ one }) => ({
    meal: one(meals, {
      fields: [mealIngredients.mealId],
      references: [meals.id],
    }),
    ingredient: one(ingredients, {
      fields: [mealIngredients.ingredientId],
      references: [ingredients.id],
    }),
  }),
);

export const tagsRelations = relations(tags, ({ many }) => ({
  meals: many(mealsTags),
}));

export const mealsTagsRelations = relations(mealsTags, ({ one }) => ({
  meal: one(meals, {
    fields: [mealsTags.mealId],
    references: [meals.id],
  }),
  tag: one(tags, {
    fields: [mealsTags.tagId],
    references: [tags.id],
  }),
}));

export const mealPlansRelations = relations(mealPlans, ({ one, many }) => ({
  user: one(users, {
    fields: [mealPlans.userId],
    references: [users.id],
  }),
  plannedMeals: many(plannedMeals),
}));

export const plannedMealsRelations = relations(plannedMeals, ({ one }) => ({
  mealPlan: one(mealPlans, {
    fields: [plannedMeals.mealPlanId],
    references: [mealPlans.id],
  }),
  meal: one(meals, {
    fields: [plannedMeals.mealId],
    references: [meals.id],
  }),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    // Assumes profiles table is accessible
    fields: [users.id],
    references: [profiles.userId],
  }),
  meals: many(meals), // Relation back to meals created by the user
  mealPlans: many(mealPlans), // Relation back to user's meal plans
}));

// --- TYPES --- (Drizzle infers these, but explicit export is good practice)

export type Meal = typeof meals.$inferSelect;
export type NewMeal = typeof meals.$inferInsert;

export type Ingredient = typeof ingredients.$inferSelect;
export type NewIngredient = typeof ingredients.$inferInsert;

export type MealIngredient = typeof mealIngredients.$inferSelect;
export type NewMealIngredient = typeof mealIngredients.$inferInsert;

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;

export type MealPlan = typeof mealPlans.$inferSelect;
export type NewMealPlan = typeof mealPlans.$inferInsert;

export type PlannedMeal = typeof plannedMeals.$inferSelect;
export type NewPlannedMeal = typeof plannedMeals.$inferInsert;

export type ShoppingList = typeof shoppingLists.$inferSelect;
export type NewShoppingList = typeof shoppingLists.$inferInsert;

export type ShoppingListItem = typeof shoppingListItems.$inferSelect;
export type NewShoppingListItem = typeof shoppingListItems.$inferInsert;

// --- NEW: Export Enum Type ---
export type IngredientCategory =
  (typeof INGREDIENT_CATEGORY_ENUM.enumValues)[number];

export const schema = {
  // Tables
  users,
  profiles,
  meals,
  mealPlans,
  plannedMeals,
  ingredients,
  mealIngredients,
  tags,
  mealsTags,

  // Relations
  usersRelations,
  profilesRelations,
  mealsRelations,
  mealPlansRelations,
  plannedMealsRelations,
  ingredientsRelations,
  mealIngredientsRelations,
  tagsRelations,
  mealsTagsRelations,

  shoppingLists,
  shoppingListItems,
  shoppingListsRelations,
  shoppingListItemsRelations,
};
