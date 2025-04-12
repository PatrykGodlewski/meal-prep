CREATE TABLE "shopping_list_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shopping_list_id" uuid NOT NULL,
	"amount" text,
	"ingredient_id" uuid,
	"is_checked" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shopping_lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text DEFAULT 'Shopping List' NOT NULL,
	"meal_plan_week_start" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "shopping_list_items" ADD CONSTRAINT "shopping_list_items_shopping_list_id_shopping_lists_id_fk" FOREIGN KEY ("shopping_list_id") REFERENCES "public"."shopping_lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopping_list_items" ADD CONSTRAINT "shopping_list_items_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopping_lists" ADD CONSTRAINT "shopping_lists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_list_ingredient" ON "shopping_list_items" USING btree ("shopping_list_id","ingredient_id");