"use client";

import type { FunctionReturnType } from "convex/server";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { api } from "@/convex/_generated/api";
import { useDateLocale } from "@/hooks/use-date-locale";
import { format } from "date-fns";

type IngredientWithMeals = FunctionReturnType<
  typeof api.ingredients.queries.getIngredient
>;

interface IngredientDisplayDetailsProps {
  ingredient: NonNullable<IngredientWithMeals>;
}

export function IngredientDisplayDetails({
  ingredient,
}: IngredientDisplayDetailsProps) {
  const t = useTranslations("ingredient");
  const tEditor = useTranslations("ingredientEditor");
  const tPlan = useTranslations("planList");
  const tMeal = useTranslations("mealPlanner");
  const dateLocale = useDateLocale();

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-lg bg-white shadow-md dark:bg-neutral-900">
        <div className="space-y-4 p-6">
          <h1 className="font-bold text-2xl">{ingredient.name}</h1>

          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-neutral-500 text-sm dark:text-neutral-400">
                {tEditor("categoryLabel")}
              </dt>
              <dd className="font-medium capitalize">
                {t(ingredient.category)}
              </dd>
            </div>
            <div>
              <dt className="text-neutral-500 text-sm dark:text-neutral-400">
                {tEditor("unitLabel")}
              </dt>
              <dd className="font-medium">{t(ingredient.unit)}</dd>
            </div>
            <div>
              <dt className="text-neutral-500 text-sm dark:text-neutral-400">
                {tEditor("caloriesLabel")}
              </dt>
              <dd className="font-medium">
                {ingredient.calories ?? 0} kcal
              </dd>
            </div>
            <div>
              <dt className="text-neutral-500 text-sm dark:text-neutral-400">
                {tPlan("createdAt")}
              </dt>
              <dd className="font-medium">
                {format(ingredient.createdAt, "MMMM d, yyyy", {
                  locale: dateLocale,
                })}
              </dd>
            </div>
            <div>
              <dt className="text-neutral-500 text-sm dark:text-neutral-400">
                {tPlan("lastUpdate")}
              </dt>
              <dd className="font-medium">
                {format(ingredient.updatedAt, "MMMM d, yyyy", {
                  locale: dateLocale,
                })}
              </dd>
            </div>
            {(() => {
              const infos = (ingredient as { replacementInfos?: { name: string; ratio: number }[] })
                .replacementInfos;
              const names = (ingredient as { replacementNames?: string[] })
                .replacementNames;
              const list = infos ?? names?.map((n) => ({ name: n, ratio: 1 })) ?? [];
              return list.length > 0 ? (
              <div className="col-span-full">
                <dt className="text-neutral-500 text-sm dark:text-neutral-400">
                  {tEditor("replacementsLabel")}
                </dt>
                <dd className="font-medium">
                  <ul className="mt-1 list-none border-l-2 border-gray-300 pl-4 text-sm dark:border-neutral-500">
                    {list.map((r) => (
                      <li key={r.name}>
                        {r.name}
                        {r.ratio !== 1 && (
                          <span className="text-neutral-400 ml-1">({r.ratio}×)</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            ) : null;
            })()}
          </dl>
        </div>
      </div>

      {ingredient.usedInMeals && ingredient.usedInMeals.length > 0 && (
        <div className="overflow-hidden rounded-lg bg-white shadow-md dark:bg-neutral-900">
          <div className="p-6">
            <h2 className="mb-4 font-semibold text-xl">
              {tMeal("showMealBreakdown")}
            </h2>
            <ul className="space-y-2">
              {ingredient.usedInMeals.map(({ meal, quantity }) => (
                <li key={meal._id}>
                  <Link
                    href={`/meals/${meal._id}`}
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {meal.name}
                  </Link>
                  <span className="text-neutral-500 dark:text-neutral-400">
                    {" "}
                    – {quantity} {t(ingredient.unit)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
