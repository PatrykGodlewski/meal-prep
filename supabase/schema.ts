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

export const MEAL_CATEGORY_ENUM = pgEnum("mealCategory", [
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

export const INGREDIENT_CATEGORY_ENUM = pgEnum("ingredientCategory", [
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
]);

export const users = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: uuid("userId")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  nickname: text("nickname"),
});

export const meals = pgTable("meals", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  instructions: text("instructions"),
  prepTimeMinutes: integer("prepTimeMinutes"),
  cookTimeMinutes: integer("cookTimeMinutes"),
  servings: integer("servings"),
  category: MEAL_CATEGORY_ENUM("category"),
  imageUrl: text("imageUrl"),
  isPublic: boolean("isPublic").default(true),
  createdBy: uuid("createdBy").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const mealPlans = pgTable("mealPlans", {
  id: serial("id").primaryKey(),
  userId: uuid("userId")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  date: date("date").notNull(),
});

export const plannedMeals = pgTable("plannedMeals", {
  id: serial("id").primaryKey(),
  mealPlanId: integer("mealPlanId")
    .references(() => mealPlans.id, { onDelete: "cascade" })
    .notNull(),
  mealId: uuid("mealId")
    .references(() => meals.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const ingredients = pgTable("ingredients", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  name: text("name").notNull().unique(),
  category: INGREDIENT_CATEGORY_ENUM("category"),
  unit: UNIT_ENUM("unit"),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const mealIngredients = pgTable(
  "mealIngredients",
  {
    mealId: uuid("mealId")
      .notNull()
      .references(() => meals.id, { onDelete: "cascade" }),
    ingredientId: uuid("ingredientId")
      .notNull()
      .references(() => ingredients.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
    isOptional: boolean("isOptional").default(false),
    notes: text("notes"),
  },
  (table) => [
    primaryKey({
      columns: [table.mealId, table.ingredientId],
    }),
  ],
);

export const shoppingLists = pgTable("shoppingLists", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  userId: uuid("userId")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  mealPlanWeekStart: date("mealPlanWeekStart"),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const shoppingListItems = pgTable(
  "shoppingListItems",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    shoppingListId: uuid("shoppingListId")
      .references(() => shoppingLists.id, { onDelete: "cascade" })
      .notNull(),
    ingredientId: uuid("ingredientId").references(() => ingredients.id),
    amount: integer("amount"),
    isChecked: boolean("isChecked").default(false).notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("uqListIngredient").on(
      table.shoppingListId,
      table.ingredientId,
    ),
  ],
);

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
  mealIngredients: many(mealIngredients),
  plannedMeals: many(plannedMeals),
  user: one(users, {
    fields: [meals.createdBy],
    references: [users.id],
  }),
}));

export const ingredientsRelations = relations(ingredients, ({ many }) => ({
  mealIngredients: many(mealIngredients),
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
    fields: [users.id],
    references: [profiles.userId],
  }),
  meals: many(meals),
  mealPlans: many(mealPlans),
}));

export type Meal = typeof meals.$inferSelect;
export type NewMeal = typeof meals.$inferInsert;

export type Ingredient = typeof ingredients.$inferSelect;
export type NewIngredient = typeof ingredients.$inferInsert;

export type MealIngredient = typeof mealIngredients.$inferSelect;
export type NewMealIngredient = typeof mealIngredients.$inferInsert;

export type MealPlan = typeof mealPlans.$inferSelect;
export type NewMealPlan = typeof mealPlans.$inferInsert;

export type PlannedMeal = typeof plannedMeals.$inferSelect;
export type NewPlannedMeal = typeof plannedMeals.$inferInsert;

export type ShoppingList = typeof shoppingLists.$inferSelect;
export type NewShoppingList = typeof shoppingLists.$inferInsert;

export type ShoppingListItem = typeof shoppingListItems.$inferSelect;
export type NewShoppingListItem = typeof shoppingListItems.$inferInsert;

export type IngredientCategory =
  (typeof INGREDIENT_CATEGORY_ENUM.enumValues)[number];

export const schema = {
  users,
  profiles,
  meals,
  mealPlans,
  plannedMeals,
  ingredients,
  mealIngredients,

  usersRelations,
  profilesRelations,
  mealsRelations,
  mealPlansRelations,
  plannedMealsRelations,
  ingredientsRelations,
  mealIngredientsRelations,

  shoppingLists,
  shoppingListItems,
  shoppingListsRelations,
  shoppingListItemsRelations,
};
