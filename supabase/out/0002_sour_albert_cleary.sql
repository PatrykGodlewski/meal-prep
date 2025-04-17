ALTER TABLE "shoppingListItems" DROP CONSTRAINT "shoppingListItems_ingredientName_ingredients_name_fk";
--> statement-breakpoint
ALTER TABLE "shoppingListItems" ADD COLUMN "createdAt" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "shoppingListItems" ADD COLUMN "updatedAt" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "shoppingListItems" DROP COLUMN "ingredientName";