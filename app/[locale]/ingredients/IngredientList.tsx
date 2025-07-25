"use client";

import { type Preloaded, useMutation, usePreloadedQuery } from "convex/react";
import { format } from "date-fns";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useDateLocale } from "@/hooks/use-date-locale";

type Props = {
  preloadedIngredients: Preloaded<
    typeof api.ingredients.queries.getIngredients
  >;
};

export function IngredientList({
  preloadedIngredients: preloadedPlans,
}: Props) {
  const ingredients = usePreloadedQuery(preloadedPlans);
  const dateLocale = useDateLocale();
  const t = useTranslations("planList");
  const deleteIngredient = useMutation(
    api.ingredients.mutations.deleteIngredient,
  );

  return (
    <>
      {ingredients.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400">
          {t("noIngredients")}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ingredients
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((ingredient) => (
              <div
                key={ingredient._id}
                className="bg-white flex flex-wrap justify-between dark:bg-neutral-900 gap-8 rounded-lg shadow-sm p-4 hover:shadow-md dark:shadow-neutral-700 transition-shadow"
              >
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold">{ingredient.name}</h2>
                  <div className="space-y-1">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {t("createdAt")}:{" "}
                      {format(ingredient.createdAt, "MMMM d, yyyy", {
                        locale: dateLocale,
                      })}
                    </p>

                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {t("lastUpdate")}:{" "}
                      {format(ingredient.updatedAt, "MMMM d, yyyy", {
                        locale: dateLocale,
                      })}
                    </p>

                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {t("id")}: {ingredient._id}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    className="flex-1"
                    variant={"destructive"}
                    onClick={() =>
                      deleteIngredient({ ingredientId: ingredient._id })
                    }
                  >
                    {t("delete")}
                  </Button>

                  <Button className="flex-1" asChild variant="outline">
                    <Link href={`/ingredients/${ingredient._id}`}>
                      {t("viewIngredient")}
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
        </div>
      )}
    </>
  );
}
