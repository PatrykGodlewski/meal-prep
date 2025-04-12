ALTER TABLE "meal_ingredients" ALTER COLUMN "quantity" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "shopping_list_items" ALTER COLUMN "amount" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "shopping_list_items" ADD COLUMN "ingredient_name" text;--> statement-breakpoint
ALTER TABLE "shopping_list_items" ADD CONSTRAINT "shopping_list_items_ingredient_name_ingredients_name_fk" FOREIGN KEY ("ingredient_name") REFERENCES "public"."ingredients"("name") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopping_lists" DROP COLUMN "name";