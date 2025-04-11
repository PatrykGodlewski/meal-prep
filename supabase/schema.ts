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
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

const authSchema = pgSchema("auth");

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
    // Changed name for clarity
    primaryKey({
      columns: [table.mealPlanId, table.mealId],
    }), // Added category to PK if one meal can be planned multiple times per day under different categories
    // If a meal can only appear once per day plan, use:
    // pk_planned_meals: primaryKey({ columns: [table.mealPlanId, table.mealId] }),
  ],
);

export const ingredients = pgTable("ingredients", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  mealId: uuid("meal_id")
    .notNull()
    .references(() => meals.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  quantity: text("quantity").notNull(),
  unit: UNIT_ENUM("unit"),
  category: INGREDIENT_CATEGORY_ENUM("category"), // Make it nullable (?) or notNull() depending on requirements
  isOptional: boolean("is_optional").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

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

// --- RELATIONS ---

export const mealsRelations = relations(meals, ({ many, one }) => ({
  ingredients: many(ingredients),
  tags: many(mealsTags),
  plannedMeals: many(plannedMeals), // Added relation to plannedMeals
  user: one(users, {
    fields: [meals.createdBy],
    references: [users.id],
  }),
}));

export const ingredientsRelations = relations(ingredients, ({ one }) => ({
  meal: one(meals, {
    fields: [ingredients.mealId],
    references: [meals.id],
  }),
}));

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

// --- TYPES --- (Drizzle infers these, but explicit export is good practice)

export type Meal = typeof meals.$inferSelect;
export type NewMeal = typeof meals.$inferInsert;

export type Ingredient = typeof ingredients.$inferSelect; // Will now include 'category'
export type NewIngredient = typeof ingredients.$inferInsert; // Will now include 'category'

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;

export type MealPlan = typeof mealPlans.$inferSelect;
export type NewMealPlan = typeof mealPlans.$inferInsert;

export type PlannedMeal = typeof plannedMeals.$inferSelect;
export type NewPlannedMeal = typeof plannedMeals.$inferInsert;

// --- NEW: Export Enum Type ---
export type IngredientCategory =
  (typeof INGREDIENT_CATEGORY_ENUM.enumValues)[number];
