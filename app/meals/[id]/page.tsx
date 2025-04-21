import { notFound } from "next/navigation";
import { preloadQuery } from "convex/nextjs";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import MealDetailView from "@/features/meal-editor/meal-editor-view";

export default async function MealDetailPage({
  params,
}: {
  params: Promise<{ id: Id<"meals"> }>;
}) {
  const mealId = (await params).id;

  if (!mealId) {
    notFound();
  }

  const preloadedMeal = await preloadQuery(
    api.meals.getMeal,
    { mealId },
    { token: await convexAuthNextjsToken() },
  );

  const preloadedIngredients = await preloadQuery(
    api.ingredients.getIngredients,
    {},
    { token: await convexAuthNextjsToken() },
  );

  if (!preloadedMeal || !mealId) {
    notFound();
  }

  return (
    <MealDetailView
      preloadedMeal={preloadedMeal}
      preloadedIngredients={preloadedIngredients}
    />
  );
}
