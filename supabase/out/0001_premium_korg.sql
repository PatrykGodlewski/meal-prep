ALTER TABLE "public"."ingredients" ALTER COLUMN "category" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."ingredientCategory";--> statement-breakpoint
CREATE TYPE "public"."ingredientCategory" AS ENUM('dairy', 'meat', 'poultry', 'seafood', 'vegetable', 'fruit', 'grain', 'legume', 'nut_seed', 'spice_herb', 'fat_oil', 'sweetener', 'condiment', 'beverage', 'baking', 'other');--> statement-breakpoint
ALTER TABLE "public"."ingredients" ALTER COLUMN "category" SET DATA TYPE "public"."ingredientCategory" USING "category"::"public"."ingredientCategory";