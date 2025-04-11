CREATE TYPE "public"."ingredient_category" AS ENUM('dairy', 'meat', 'poultry', 'seafood', 'vegetable', 'fruit', 'grain', 'legume', 'nut_seed', 'spice_herb', 'fat_oil', 'sweetener', 'condiment', 'beverage', 'baking', 'other');--> statement-breakpoint
ALTER TABLE "planned_meals" DROP CONSTRAINT "planned_meals_meal_plan_id_meal_plans_id_fk";
--> statement-breakpoint
ALTER TABLE "planned_meals" DROP CONSTRAINT "planned_meals_meal_id_meals_id_fk";
--> statement-breakpoint
ALTER TABLE "planned_meals" DROP CONSTRAINT "planned_meals_meal_plan_id_meal_id_pk";--> statement-breakpoint
ALTER TABLE "planned_meals" ADD CONSTRAINT "planned_meals_meal_plan_id_meal_id_category_pk" PRIMARY KEY("meal_plan_id","meal_id","category");--> statement-breakpoint
ALTER TABLE "ingredients" ADD COLUMN "category" "ingredient_category";--> statement-breakpoint
ALTER TABLE "planned_meals" ADD CONSTRAINT "planned_meals_meal_plan_id_meal_plans_id_fk" FOREIGN KEY ("meal_plan_id") REFERENCES "public"."meal_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planned_meals" ADD CONSTRAINT "planned_meals_meal_id_meals_id_fk" FOREIGN KEY ("meal_id") REFERENCES "public"."meals"("id") ON DELETE cascade ON UPDATE no action;