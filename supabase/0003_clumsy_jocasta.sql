ALTER TABLE "planned_meals" DROP CONSTRAINT "planned_meals_meal_plan_id_meal_id_category_pk";--> statement-breakpoint
ALTER TABLE "planned_meals" ADD CONSTRAINT "planned_meals_meal_plan_id_meal_id_pk" PRIMARY KEY("meal_plan_id","meal_id");--> statement-breakpoint
ALTER TABLE "meal_plans" DROP COLUMN "day";--> statement-breakpoint
ALTER TABLE "planned_meals" DROP COLUMN "category";--> statement-breakpoint
DROP TYPE "public"."day";