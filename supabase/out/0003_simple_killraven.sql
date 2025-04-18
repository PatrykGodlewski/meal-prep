ALTER TABLE "mealPlans" DROP CONSTRAINT "mealPlans_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "meals" DROP CONSTRAINT "meals_createdBy_users_id_fk";
--> statement-breakpoint
ALTER TABLE "profiles" DROP CONSTRAINT "profiles_userId_users_id_fk";
--> statement-breakpoint
ALTER TABLE "meals" ALTER COLUMN "isPublic" SET DEFAULT true;--> statement-breakpoint
ALTER TABLE "mealPlans" ADD CONSTRAINT "mealPlans_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meals" ADD CONSTRAINT "meals_createdBy_users_id_fk" FOREIGN KEY ("createdBy") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;