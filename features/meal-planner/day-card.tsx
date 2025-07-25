"use client";
import type { FunctionReturnType } from "convex/server";
import { format, isValid, toDate } from "date-fns";
import { camelCase } from "lodash";
import { Flame, Lock, Unlock } from "lucide-react"; // Import Unlock icon
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "use-intl";
import { For } from "@/components/for-each";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { api } from "@/convex/_generated/api";
import { useDateLocale } from "@/hooks/use-date-locale";
import { cn } from "@/lib/utils";
import { useMealPlanner } from "./store";

const DATE_FORMAT_DISPLAY_CARD = "MMM dd";

interface PlanCardProps {
  plan?: FunctionReturnType<typeof api.plans.getWeeklyMealPlan>[number];
}

export function PlanCard({ plan }: PlanCardProps) {
  const { lockMealPlan, isLocking } = useMealPlanner();
  const t = useTranslations("mealPlanner");
  const tMeal = useTranslations("meal");
  const dateLocale = useDateLocale();

  const summarizedCalories = plan?.planMeals.reduce(
    (previousValue, currentValue) => {
      const calories = currentValue.meal?.calories ?? 0;
      return previousValue + calories;
    },
    0,
  );

  if (!plan) {
    return (
      <Card className="flex min-h-[150px] flex-col border-2 border-neutral-800 border-dashed bg-neutral-50 shadow-xs dark:bg-neutral-950">
        <CardHeader className="p-3">
          <CardTitle className="font-medium text-neutral-400 text-sm dark:text-neutral-600">
            {t("notCreated")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex grow items-center justify-center p-3">
          <span className="text-neutral-400 text-xs italic dark:text-neutral-600">
            {t("empty")}
          </span>
        </CardContent>
      </Card>
    );
  }

  if (!isValid(toDate(plan.date))) {
    return (
      <Card className="flex min-h-[150px] flex-col border-red-500 shadow-xs">
        <CardHeader className="p-3">
          <CardTitle className="text-red-600 text-sm">
            {t("dateError")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 text-red-500 text-xs">
          {t("invalidDate")}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "flex min-h-[150px] flex-col py-0 shadow-xs transition-colors duration-700 hover:bg-neutral-100 dark:bg-neutral-950 dark:hover:bg-neutral-900",
      )}
    >
      <CardHeader className="px-3 pt-3">
        <CardTitle className="flex items-center justify-between py-0 font-medium text-sm ">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => lockMealPlan(plan._id)}
            disabled={isLocking}
            aria-label={plan.locked ? t("unlockPlan") : t("lockPlan")}
          >
            {plan.locked ? (
              <Lock className="h-4 w-4" />
            ) : (
              <Unlock className="h-4 w-4" />
            )}
          </Button>

          <span className="grow first-letter:uppercase">
            {format(plan.date, "EEEE", { locale: dateLocale })}
          </span>

          <span className="text-neutral-500 text-xs">
            {format(plan.date, DATE_FORMAT_DISPLAY_CARD, {
              locale: dateLocale,
            })}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex grow flex-col justify-between space-y-2 p-3">
        <div className="flex items-end justify-between gap-4">
          <ul className="group flex flex-1 flex-wrap justify-between gap-4 text-xs">
            <For
              each={plan.planMeals}
              empty={
                <li className="pt-4 text-center text-gray-400 italic">
                  {t("noMeals")}
                </li>
              }
            >
              {(plannedMeal) => {
                const isPlannedMeal = plannedMeal.meal?.name;
                return (
                  <li
                    className={cn("flex-1", {
                      "rounded-xl border-2 border-neutral-500 border-dashed p-2":
                        !isPlannedMeal,
                    })}
                    key={`${plan._id}-${plannedMeal.meal?.categories?.toString}-${plannedMeal._id}`}
                  >
                    {isPlannedMeal ? (
                      <Link
                        className="relative flex h-full min-w-24 flex-wrap items-center justify-center rounded-xl border-2 border-neutral-700 border-dashed bg-white p-2 hover:underline dark:bg-neutral-950"
                        href={`/meals/${plannedMeal.meal?._id}`}
                      >
                        <Image
                          src={plannedMeal.meal?.imageUrl ?? "/placeholder.png"}
                          width={128}
                          height={128}
                          className={"rounded-lg"}
                          alt={"Meal image"}
                        />
                        <span className="absolute top-2 right-2 rounded-full bg-neutral-200 px-2 py-1 font-semibold capitalize shadow-xs dark:bg-neutral-900/25">
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
          <p className="flex items-center gap-2 rounded-xl border border-neutral-400 border-dashed px-3 py-2">
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
