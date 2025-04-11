CREATE TABLE "meal_ingredients" (
	"meal_id" uuid NOT NULL,
	"ingredient_id" uuid NOT NULL,
	"quantity" text NOT NULL,
	"is_optional" boolean DEFAULT false,
	"notes" text,
	CONSTRAINT "meal_ingredients_meal_id_ingredient_id_pk" PRIMARY KEY("meal_id","ingredient_id")
);
--> statement-breakpoint
ALTER TABLE "ingredients" DROP CONSTRAINT "ingredients_meal_id_meals_id_fk";
--> statement-breakpoint
ALTER TABLE "meal_ingredients" ADD CONSTRAINT "meal_ingredients_meal_id_meals_id_fk" FOREIGN KEY ("meal_id") REFERENCES "public"."meals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_ingredients" ADD CONSTRAINT "meal_ingredients_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingredients" DROP COLUMN "meal_id";--> statement-breakpoint
ALTER TABLE "ingredients" DROP COLUMN "quantity";--> statement-breakpoint
ALTER TABLE "ingredients" DROP COLUMN "is_optional";--> statement-breakpoint
ALTER TABLE "ingredients" DROP COLUMN "notes";--> statement-breakpoint
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_name_unique" UNIQUE("name");