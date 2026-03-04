import { format } from "date-fns";
import { Calendar, ChefHat, Clock, Flame, type LucideIcon } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import React from "react";
import { For } from "@/components/for-each";
import ServingController from "@/components/serving-controller";
import { useDateLocale } from "@/hooks/use-date-locale";
import { calculateIngredientKcal } from "@/lib/nutrition";
import { useMealPlanner } from "../meal-planner/store";
import { DATE_FORMAT_FULL } from "../meal-planner/utils";
import type { Meal, MealIngredients } from "./types";

interface MealDisplayDetailsProps {
  meal: Meal;
  mealIngredients: MealIngredients;
}

type MealLabelProps = {
  icon: LucideIcon;
  text: string | number | null | undefined;
};
function MealLabel({ icon: Icon, text }: MealLabelProps) {
  if (text === null || text === undefined || String(text).trim() === "")
    return null;

  return (
    <div className="mr-4 mb-2 flex items-center whitespace-nowrap text-sm">
      <Icon className="mr-1.5 h-4 w-4 shrink-0" />
      <span className="first-letter:uppercase">{text}</span>
    </div>
  );
}

export const MealDisplayDetails: React.FC<MealDisplayDetailsProps> = React.memo(
  ({ meal, mealIngredients }) => {
    const { servings } = useMealPlanner();

    const t = useTranslations("mealDetails");
    const tIngredient = useTranslations("ingredient");
    const dateLocale = useDateLocale();

    const totalTime = (meal.prepTimeMinutes || 0) + (meal.cookTimeMinutes || 0);
    const authorName = meal.authorDisplayName ?? "Unknown";

    // Kcal from ingredients: sum (quantity in grams / 100) * calories per 100g for each ingredient
    const baseKcalFromIngredients = mealIngredients.reduce(
      (acc, mealIng) =>
        acc +
        calculateIngredientKcal(
          mealIng.quantity,
          mealIng.ingredient?.unit ?? "g",
          mealIng.ingredient?.calories,
        ),
      0,
    );

    const recipeServings = meal.servings ?? 1;
    const scaleFactor = servings / recipeServings;

    const kcalFromIngredients = Math.round(baseKcalFromIngredients * scaleFactor);
    // meal.calories = kcal per serving; total = per-serving * number of servings
    const manualKcal = meal.calories
      ? Math.round(meal.calories * servings)
      : null;

    return (
      <div className="overflow-hidden rounded-lg bg-white shadow-md dark:bg-neutral-900">
        <div className="relative h-64 w-full bg-gray-200 md:h-96 dark:bg-neutral-800">
          {meal.imageUrl ? (
            <Image
              src={meal.imageUrl}
              alt={meal.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gray-100 dark:bg-neutral-700">
              <span className="text-gray-500 text-lg dark:text-neutral-400">
                {t("noImage")}
              </span>
            </div>
          )}
          <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
            {meal?.categories?.map((cat, idx) => (
              <span
                key={cat + idx}
                className="rounded-full bg-blue-600 px-3 py-1 text-right font-medium text-white text-xs uppercase tracking-wide"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-6 p-6">
          <h1 className="font-bold text-3xl text-gray-900 dark:text-white">
            {meal.name}
          </h1>

          <div className="flex flex-wrap items-center text-gray-600 dark:text-neutral-400 ">
            <MealLabel
              icon={ChefHat}
              text={t("author", { name: authorName })}
            />
            <MealLabel
              icon={Calendar}
              text={format(meal.createdAt, DATE_FORMAT_FULL, {
                locale: dateLocale,
              })}
            />
            {totalTime > 0 && (
              <MealLabel
                icon={Clock}
                text={t("totalTime", { count: totalTime })}
              />
            )}
            {manualKcal != null && (
              <MealLabel
                icon={Flame}
                text={t("caloriesManual", { count: manualKcal })}
              />
            )}
            {kcalFromIngredients > 0 && (
              <MealLabel
                icon={Flame}
                text={t("caloriesByIngredients", {
                  count: kcalFromIngredients,
                })}
              />
            )}
          </div>

          {meal.description && (
            <div>
              <h2 className="mb-2 font-semibold text-gray-800 text-xl dark:text-gray-200">
                {t("descriptionTitle")}
              </h2>
              <p className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-neutral-300">
                {meal.description}
              </p>
            </div>
          )}

          <ServingController />

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <h2 className="mb-4 font-semibold text-gray-800 text-xl dark:text-gray-200">
                {t("ingredientsTitle")}
              </h2>

              <ul className="space-y-2 text-gray-700 text-sm dark:text-neutral-300">
                <For
                  each={mealIngredients}
                  empty={
                    <p className="text-gray-500 text-sm italic dark:text-neutral-500">
                      {t("noIngredients")}
                    </p>
                  }
                >
                  {(mealIngredient) => {
                    const ingredient = mealIngredient.ingredient;
                    const replacementNames = (
                      mealIngredient as { replacementNames?: string[] }
                    ).replacementNames;
                    return (
                      <li
                        key={ingredient?._id}
                        className="flex items-start gap-2"
                      >
                        <span className="mt-[7px] inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                        <div>
                          <span className="font-medium">
                            {mealIngredient.quantity * servings}{" "}
                            {tIngredient(ingredient?.unit ?? "unknown")}{" "}
                            {ingredient?.name}
                          </span>
                          {ingredient?.category && (
                            <span className="ml-2 text-gray-500 text-xs capitalize dark:text-neutral-400">
                              ({tIngredient(ingredient?.category)})
                            </span>
                          )}
                          {mealIngredient.isOptional && (
                            <span className="ml-2 text-gray-500 text-xs dark:text-neutral-500">
                              {t("optionalMarker")}
                            </span>
                          )}
                          {mealIngredient.notes && (
                            <p className="mt-0.5 pl-0 text-gray-600 text-xs dark:text-neutral-400">
                              {mealIngredient.notes}
                            </p>
                          )}
                          {replacementNames &&
                            replacementNames.length > 0 && (
                              <div className="mt-1">
                                <span className="text-gray-500 text-xs dark:text-neutral-400">
                                  {t("substitutesLabel")}:
                                </span>
                                <ul className="mt-0.5 list-none border-l-2 border-gray-300 pl-4 text-gray-500 text-xs dark:border-neutral-500 dark:text-neutral-400">
                                  {((
                                    mealIngredient as {
                                      replacementInfos?: { name: string; ratio: number }[];
                                    }
                                  ).replacementInfos ?? replacementNames.map((n) => ({ name: n, ratio: 1 }))).map(
                                    ({ name, ratio }) => {
                                      const baseQty = mealIngredient.quantity * servings;
                                      const calculatedQty = Math.round(baseQty * ratio);
                                      const unit = tIngredient(ingredient?.unit ?? "g");
                                      return (
                                        <li key={name}>
                                          {name}
                                          <span className="text-gray-400 ml-1">
                                            ({calculatedQty} {unit})
                                          </span>
                                        </li>
                                      );
                                    },
                                  )}
                                </ul>
                              </div>
                            )}
                        </div>
                      </li>
                    );
                  }}
                </For>
              </ul>
            </div>

            <div className="lg:col-span-2">
              <h2 className="mb-4 font-semibold text-gray-800 text-xl dark:text-gray-200">
                {t("instructionsTitle")}
              </h2>
              <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-neutral-300">
                <For
                  each={meal.instructions?.split("\n")}
                  empty={
                    <p className="text-gray-500 italic dark:text-neutral-500">
                      {t("noInstructions")}
                    </p>
                  }
                >
                  {(paragraph, idx) =>
                    paragraph.trim() && (
                      <p key={idx} className="mb-3">
                        {paragraph}
                      </p>
                    )
                  }
                </For>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);
