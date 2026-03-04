import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { preloadQuery } from "convex/nextjs";
import { getLocale } from "next-intl/server";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import IngredientDetailView from "@/features/ingredient-editor/ingredient-detail-view";
import { redirect } from "@/i18n/navigation";

export default async function IngredientDetailPage({
  params,
}: {
  params: Promise<{ id: Id<"ingredients"> }>;
}) {
  const ingredientId = (await params).id;

  if (!ingredientId) {
    redirect({ href: "/ingredients", locale: await getLocale() });
  }

  const preloadedIngredient = await preloadQuery(
    api.ingredients.queries.getIngredient,
    { ingredientId },
    { token: await convexAuthNextjsToken() },
  );

  if (!preloadedIngredient) {
    redirect({ href: "/ingredients", locale: await getLocale() });
  }

  return <IngredientDetailView preloadedIngredient={preloadedIngredient} />;
}
