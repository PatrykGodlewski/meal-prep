import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { preloadQuery } from "convex/nextjs";
import { getLocale } from "next-intl/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import MealDetailView from "@/features/meal-editor/meal-editor-view";
import { redirect } from "@/i18n/navigation";

export default async function MealDetailPage({
  params,
}: {
  params: Promise<{ id: Id<"meals"> }>;
}) {
  const mealId = (await params).id;

  if (!mealId) {
    redirect({ href: "/meals", locale: await getLocale() });
  }

  const preloadedMeal = await preloadQuery(
    api.meals.queries.getMeal,
    { mealId },
    { token: await convexAuthNextjsToken() },
  );

  const preloadedIngredients = await preloadQuery(
    api.ingredients.queries.getIngredients,
    {},
    { token: await convexAuthNextjsToken() },
  );

  if (!preloadedMeal || !mealId) {
    redirect({ href: "/meals", locale: await getLocale() });
  }

  return (
    <MealDetailView
      preloadedMeal={preloadedMeal}
      preloadedIngredients={preloadedIngredients}
    />
  );
}
