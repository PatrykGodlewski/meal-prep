import { format } from "date-fns";
import { Calendar, ChefHat, Clock, Flame, type LucideIcon } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import React from "react";
import { For } from "@/components/for-each";
import ServingController from "@/components/serving-controller";
import { useDateLocale } from "@/hooks/use-date-locale";
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
    <div className="flex items-center mr-4 mb-2 whitespace-nowrap text-sm">
      <Icon className="h-4 w-4 mr-1.5 shrink-0" />
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
    const authorName = meal.createdBy;
    const caloriesByIngredients = mealIngredients.reduce(
      (acc, mealIng) => (mealIng.ingredient?.calories ?? 0) + acc,
      0,
    );

    return (
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-md overflow-hidden">
        <div className="relative h-64 md:h-96 w-full bg-gray-200 dark:bg-neutral-800">
          {meal.imageUrl ? (
            <Image
              src={meal.imageUrl}
              alt={meal.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-neutral-700">
              <span className="text-gray-500 dark:text-neutral-400 text-lg">
                {t("noImage")}
              </span>
            </div>
          )}
          <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
            {meal?.categories?.map((cat, idx) => (
              <span
                key={cat + idx}
                className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs text-right font-medium uppercase tracking-wide"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
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
            {meal.calories && (
              <MealLabel
                icon={Flame}
                text={t("calories", { count: meal.calories * servings })}
              />
            )}
            <MealLabel
              icon={Flame}
              text={t("caloriesByIngredients", {
                count: caloriesByIngredients,
              })}
            />
          </div>

          {meal.description && (
            <div>
              <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">
                {t("descriptionTitle")}
              </h2>
              <p className="text-gray-700 dark:text-neutral-300 prose prose-sm dark:prose-invert max-w-none">
                {meal.description}
              </p>
            </div>
          )}

          <ServingController />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                {t("ingredientsTitle")}
              </h2>

              <ul className="space-y-2 text-sm text-gray-700 dark:text-neutral-300">
                <For
                  each={mealIngredients}
                  empty={
                    <p className="text-sm text-gray-500 dark:text-neutral-500 italic">
                      {t("noIngredients")}
                    </p>
                  }
                >
                  {(mealIngredient) => {
                    const ingredient = mealIngredient.ingredient;
                    return (
                      <li
                        key={ingredient?._id}
                        className="flex items-start gap-2"
                      >
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mt-[7px] shrink-0" />
                        <div>
                          <span className="font-medium">
                            {mealIngredient.quantity * servings}{" "}
                            {tIngredient(ingredient?.unit ?? "unknown")}{" "}
                            {ingredient?.name}
                          </span>
                          {ingredient?.category && (
                            <span className="ml-2 text-xs text-gray-500 dark:text-neutral-400 capitalize">
                              ({tIngredient(ingredient?.category)})
                            </span>
                          )}
                          {mealIngredient.isOptional && (
                            <span className="ml-2 text-xs text-gray-500 dark:text-neutral-500">
                              {t("optionalMarker")}
                            </span>
                          )}
                          {mealIngredient.notes && (
                            <p className="text-xs text-gray-600 dark:text-neutral-400 pl-0 mt-0.5">
                              {mealIngredient.notes}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  }}
                </For>
              </ul>
            </div>

            <div className="lg:col-span-2">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                {t("instructionsTitle")}
              </h2>
              <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-neutral-300">
                <For
                  each={meal.instructions?.split("\n")}
                  empty={
                    <p className="text-gray-500 dark:text-neutral-500 italic">
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
