"use client";
import { format, isValid, toDate } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { For } from "@/components/for-each";
import { Button } from "@/components/ui/button";
import type { api } from "@/convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import { Flame } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "use-intl";
import { useDateLocale } from "@/hooks/use-date-locale";
import { camelCase } from "lodash";
import { MEAL_CATEGORIES } from "@/convex/schema";

const DATE_FORMAT_DISPLAY_CARD = "MMM dd";

interface PlanCardProps {
  plan?: FunctionReturnType<typeof api.mealPlans.getWeeklyMealPlan>[number];
}

export function PlanCard({ plan }: PlanCardProps) {
  const t = useTranslations("mealPlanner");
  const tMeal = useTranslations("meal");
  const dateLocale = useDateLocale();

  const summarizedCalories = plan?.plannedMeals.reduce(
    (previousValue, currentValue) => {
      const calories = currentValue.meal?.calories ?? 0;
      return previousValue + calories;
    },
    0,
  );

  if (!plan) {
    return (
      <Card className="shadow-sm flex flex-col min-h-[150px] border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 border-2 border-dashed">
        <CardHeader className="p-3">
          <CardTitle className="text-sm font-medium text-neutral-400 dark:text-neutral-600">
            {t("notCreated")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 flex-grow flex items-center justify-center">
          <span className="text-xs text-neutral-400 dark:text-neutral-600 italic">
            {t("empty")}
          </span>
        </CardContent>
      </Card>
    );
  }

  if (!isValid(toDate(plan.date))) {
    return (
      <Card className="shadow-sm flex flex-col min-h-[150px] border-red-500">
        <CardHeader className="p-3">
          <CardTitle className="text-sm text-red-600">
            {t("dateError")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 text-xs text-red-500">
          {t("invalidDate")}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("shadow-sm flex flex-col min-h-[150px]")}>
      <CardHeader className="p-3">
        <CardTitle className="flex items-center justify-between text-sm font-medium ">
          <span className="first-letter:uppercase">
            {format(plan.date, "EEEE", { locale: dateLocale })}
          </span>

          <span className="text-xs text-neutral-500">
            {format(plan.date, DATE_FORMAT_DISPLAY_CARD, {
              locale: dateLocale,
            })}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 justify-between flex flex-col space-y-2 flex-grow">
        <div className="flex justify-between items-end gap-4">
          <ul className="text-xs group flex flex-wrap justify-between gap-4 flex-1">
            <For
              each={plan.plannedMeals}
              empty={
                <li className="text-center text-gray-400 italic pt-4">
                  {t("noMeals")}
                </li>
              }
            >
              {(plannedMeal) => {
                const isPlannedMeal = plannedMeal.meal?.name;
                return (
                  <li
                    className={cn("flex-1", {
                      "rounded-xl p-2 border-dashed border-2 border-neutral-500":
                        !isPlannedMeal,
                    })}
                    key={`${plan._id}-${plannedMeal.meal?.category}-${plannedMeal._id}`}
                  >
                    {isPlannedMeal ? (
                      <Link
                        className="hover:underline h-full flex-wrap min-w-24 relative flex items-center justify-center p-2 border-2 border-dashed rounded-xl"
                        href={`/meals/${plannedMeal.meal?._id}`}
                      >
                        <Image
                          src={plannedMeal.meal?.imageUrl ?? "/placeholder.png"}
                          width={128}
                          height={128}
                          className={"rounded-lg"}
                          alt={"Meal image"}
                        />
                        <span className="absolute px-2 py-1 right-2 top-2 rounded-full shadow-sm bg-neutral-200 dark:bg-neutral-900/25 font-semibold capitalize">
                          {tMeal(camelCase(plannedMeal.category))}
                        </span>
                        <p className="w-full px-2">
                          {plannedMeal.meal?.name.trim()}
                        </p>
                      </Link>
                    ) : (
                      <Link
                        className="text-neutral-500 underline"
                        href={`/plans/${plan._id}`}
                      >
                        {t("plannedMealMissing")}
                      </Link>
                    )}
                  </li>
                );
              }}
            </For>
          </ul>
        </div>

        {/* // Statistics component  */}
        <div className="flex justify-end py-4">
          <p className="border py-2 px-3 rounded-xl border-dashed border-neutral-400 flex items-center gap-2">
            {summarizedCalories} Kcal
            <Flame size={18} className="mb-[2px]" />
          </p>
        </div>

        <Button size={"sm"} asChild>
          <Link href={`/plans/${plan._id}`}>{t("goToPlan")}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
