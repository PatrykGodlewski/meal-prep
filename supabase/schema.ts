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
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Optional: Create an enum for meal categories
export const mealCategoryEnum = pgEnum("meal_category", [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
  "dessert",
]);

// Optional: Create an enum for measurement units
export const unitEnum = pgEnum("unit", [
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

const authSchema = pgSchema("auth");

const users = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  user_id: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  nickname: text("nickname"),
});

// Meals table
export const meals = pgTable("meals", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  instructions: text("instructions"),
  prepTimeMinutes: integer("prep_time_minutes"),
  cookTimeMinutes: integer("cook_time_minutes"),
  servings: integer("servings"),
  category: mealCategoryEnum("category"),
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

// Ingredients table
export const ingredients = pgTable("ingredients", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  mealId: uuid("meal_id")
    .notNull()
    .references(() => meals.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  quantity: text("quantity").notNull(),
  unit: unitEnum("unit"),
  isOptional: boolean("is_optional").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Optional: Tags table for categorizing meals
export const tags = pgTable("tags", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Optional: Junction table for many-to-many relationship between meals and tags
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
  (table) => {
    return {
      pk: primaryKey({ columns: [table.mealId, table.tagId] }),
    };
  },
);

// Define relationships
export const mealsRelations = relations(meals, ({ many, one }) => ({
  ingredients: many(ingredients),
  tags: many(mealsTags),
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

// Export types for type safety
export type Meal = typeof meals.$inferSelect;
export type NewMeal = typeof meals.$inferInsert;

export type Ingredient = typeof ingredients.$inferSelect;
export type NewIngredient = typeof ingredients.$inferInsert;

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
