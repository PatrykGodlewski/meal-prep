ALTER TABLE "ingredients" DROP CONSTRAINT "ingredients_meal_id_meals_id_fk";
--> statement-breakpoint
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_meal_id_meals_id_fk" FOREIGN KEY ("meal_id") REFERENCES "public"."meals"("id") ON DELETE set null ON UPDATE no action;