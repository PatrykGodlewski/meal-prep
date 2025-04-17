CREATE TYPE "public"."ingredientCategory" AS ENUM('dairy', 'meat', 'poultry', 'seafood', 'vegetable', 'fruit', 'grain', 'legume', 'nutSeed', 'spiceHerb', 'fatOil', 'sweetener', 'condiment', 'beverage', 'baking', 'other');--> statement-breakpoint
CREATE TYPE "public"."mealCategory" AS ENUM('breakfast', 'lunch', 'dinner', 'snack');--> statement-breakpoint
CREATE TYPE "public"."unit" AS ENUM('g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'oz', 'lb', 'piece', 'pinch');--> statement-breakpoint
CREATE TABLE "ingredients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" "ingredientCategory",
	"unit" "unit",
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ingredients_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "mealIngredients" (
	"mealId" uuid NOT NULL,
	"ingredientId" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"isOptional" boolean DEFAULT false,
	"notes" text,
	CONSTRAINT "mealIngredients_mealId_ingredientId_pk" PRIMARY KEY("mealId","ingredientId")
);
--> statement-breakpoint
CREATE TABLE "mealPlans" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"date" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"instructions" text,
	"prepTimeMinutes" integer,
	"cookTimeMinutes" integer,
	"servings" integer,
	"category" "mealCategory",
	"imageUrl" text,
	"isPublic" boolean DEFAULT false,
	"createdBy" uuid,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plannedMeals" (
	"mealPlanId" integer NOT NULL,
	"mealId" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plannedMeals_mealPlanId_mealId_pk" PRIMARY KEY("mealPlanId","mealId")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" uuid NOT NULL,
	"nickname" text
);
--> statement-breakpoint
CREATE TABLE "shoppingListItems" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shoppingListId" uuid NOT NULL,
	"amount" integer,
	"ingredientId" uuid,
	"ingredientName" text,
	"isChecked" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shoppingLists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"mealPlanWeekStart" date,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth"."users" (
	"id" uuid PRIMARY KEY NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mealIngredients" ADD CONSTRAINT "mealIngredients_mealId_meals_id_fk" FOREIGN KEY ("mealId") REFERENCES "public"."meals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mealIngredients" ADD CONSTRAINT "mealIngredients_ingredientId_ingredients_id_fk" FOREIGN KEY ("ingredientId") REFERENCES "public"."ingredients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mealPlans" ADD CONSTRAINT "mealPlans_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meals" ADD CONSTRAINT "meals_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plannedMeals" ADD CONSTRAINT "plannedMeals_mealPlanId_mealPlans_id_fk" FOREIGN KEY ("mealPlanId") REFERENCES "public"."mealPlans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plannedMeals" ADD CONSTRAINT "plannedMeals_mealId_meals_id_fk" FOREIGN KEY ("mealId") REFERENCES "public"."meals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shoppingListItems" ADD CONSTRAINT "shoppingListItems_shoppingListId_shoppingLists_id_fk" FOREIGN KEY ("shoppingListId") REFERENCES "public"."shoppingLists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shoppingListItems" ADD CONSTRAINT "shoppingListItems_ingredientId_ingredients_id_fk" FOREIGN KEY ("ingredientId") REFERENCES "public"."ingredients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shoppingListItems" ADD CONSTRAINT "shoppingListItems_ingredientName_ingredients_name_fk" FOREIGN KEY ("ingredientName") REFERENCES "public"."ingredients"("name") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shoppingLists" ADD CONSTRAINT "shoppingLists_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uqListIngredient" ON "shoppingListItems" USING btree ("shoppingListId","ingredientId");