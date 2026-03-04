"use client";
import { useConvexMutation } from "@convex-dev/react-query";
import type { FunctionReturnType } from "convex/server";
import { format, isValid, toDate } from "date-fns";
import { camelCase } from "lodash";
import { Check, Flame, Lock, Minus, Pencil, Plus, Unlock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { For } from "@/components/for-each";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { MEAL_CATEGORIES } from "@/convex/schema";
import { useDateLocale } from "@/hooks/use-date-locale";
import { getExtraKcal, getPlanTotals } from "@/lib/plan-kcal";
import { cn } from "@/lib/utils";
import { ModalMeals } from "./ModalMeals";
import { useMealPlanner } from "./store";

const DATE_FORMAT_DISPLAY_CARD = "MMM dd";

interface PlanCardProps {
  plan?: FunctionReturnType<typeof api.plans.getWeeklyMealPlan>[number];
}

export function PlanCard({ plan }: PlanCardProps) {
  const { lockMealPlan, isLocking, servings } = useMealPlanner();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExtraModalOpen, setIsExtraModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<
    (typeof MEAL_CATEGORIES)[number] | null
  >(null);
  const markEatenMutation = useConvexMutation(api.plans.markPlanMealAsEaten);
  const updateMealMutation = useConvexMutation(
    api.plans.updatePlannedMealByCategory,
  );
  const addExtraMutation = useConvexMutation(api.plans.addPlanExtra);
  const removeExtraMutation = useConvexMutation(api.plans.removePlanExtra);
  const t = useTranslations("mealPlanner");
  const tMeal = useTranslations("meal");
  const tExtras = useTranslations("planExtras");
  const dateLocale = useDateLocale();

  const handleOpenChangeMeal = (category: (typeof MEAL_CATEGORIES)[number]) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleMealSelect = async (mealId: Id<"meals">) => {
    if (!plan?.date || !editingCategory) return;
    await updateMealMutation({
      date: plan.date,
      category: editingCategory,
      newMealId: mealId,
    });
    setIsModalOpen(false);
  };

  const handleExtraMealSelect = async (mealId: Id<"meals">) => {
    if (!plan) return;
    await addExtraMutation({ planId: plan._id, mealId });
    setIsExtraModalOpen(false);
  };

  const { total: totalKcal, eaten: eatenKcal } = plan?.planMeals
    ? getPlanTotals(plan.planMeals, servings, plan.planExtras)
    : { total: 0, eaten: 0 };
  const progressPercent =
    totalKcal > 0 ? Math.min(100, Math.round((eatenKcal / totalKcal) * 100)) : 0;

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
        <ModalMeals
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          onMealSelect={handleMealSelect}
          filter={editingCategory ?? undefined}
        />
        <ModalMeals
          isOpen={isExtraModalOpen}
          onOpenChange={setIsExtraModalOpen}
          onMealSelect={handleExtraMealSelect}
        />
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
                const isEaten = !!plannedMeal.eatenAt;
                const category =
                  plannedMeal.category as (typeof MEAL_CATEGORIES)[number];
                return (
                  <li
                    className={cn("flex-1", {
                      "rounded-xl border-2 border-neutral-500 border-dashed p-2":
                        !isPlannedMeal,
                    })}
                    key={`${plan._id}-${plannedMeal.meal?.categories?.toString}-${plannedMeal._id}`}
                  >
                    {isPlannedMeal ? (
                      <div className="relative flex flex-col gap-1">
                        <Link
                          className="relative flex h-full min-w-24 flex-wrap items-center justify-center rounded-xl border-2 border-neutral-700 border-dashed bg-white p-2 hover:underline dark:bg-neutral-950"
                          href={`/meals/${plannedMeal.meal?._id}`}
                        >
                          <Image
                            src={plannedMeal.meal?.imageUrl ?? "/placeholder.png"}
                            width={128}
                            height={128}
                            className={cn("rounded-lg", isEaten && "opacity-60")}
                            alt={"Meal image"}
                          />
                          <span className="absolute top-2 right-2 rounded-full bg-neutral-200 px-2 py-1 font-semibold capitalize shadow-xs dark:bg-neutral-900/25">
                            {tMeal(camelCase(plannedMeal.category))}
                          </span>
                          <p className="w-full px-2">
                            {plannedMeal.meal?.name.trim()}
                          </p>
                        </Link>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant={isEaten ? "default" : "outline"}
                            className="h-8 w-8 shrink-0"
                            aria-label={
                              isEaten ? t("unmarkAsEaten") : t("markAsEaten")
                            }
                            onClick={(e) => {
                              e.preventDefault();
                              markEatenMutation({
                                planMealId: plannedMeal._id,
                                eaten: !isEaten,
                              });
                            }}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 shrink-0"
                            aria-label={t("changeMeal")}
                            onClick={(e) => {
                              e.preventDefault();
                              handleOpenChangeMeal(category);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 shrink-0"
                          aria-label={t("changeMeal")}
                          onClick={() => handleOpenChangeMeal(category)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Link
                          className="text-neutral-500 underline"
                          href={`/plans/${plan._id}`}
                        >
                          {t("plannedMealMissing")}
                        </Link>
                      </div>
                    )}
                  </li>
                );
              }}
            </For>
          </ul>
        </div>

        {/* Extras */}
        {plan.planExtras && plan.planExtras.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {plan.planExtras.map((extra) => {
              const extraKcal = getExtraKcal(extra);
              return (
                <span
                  key={extra._id}
                  className="flex items-center gap-1 rounded-lg border border-neutral-400 border-dashed bg-neutral-100 px-2 py-1 text-xs dark:bg-neutral-900"
                >
                  {extra.meal ? (
                    <Link
                      href={`/meals/${extra.meal._id}`}
                      className="hover:underline"
                    >
                      {extra.meal.name}
                    </Link>
                  ) : (
                    "—"
                  )}{" "}
                  ({extraKcal} kcal)
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-5 w-5 shrink-0"
                    aria-label={tExtras("remove")}
                    onClick={(e) => {
                      e.preventDefault();
                      removeExtraMutation({ planExtraId: extra._id });
                    }}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                </span>
              );
            })}
          </div>
        )}

        {/* // Kcal stats & progress */}
        <div className="space-y-2 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <p className="flex items-center gap-2 rounded-xl border border-neutral-400 border-dashed px-3 py-2 text-sm">
                <Flame size={18} className="mb-[2px]" />
                {eatenKcal}/{totalKcal} kcal
              </p>
              <Button
                size="sm"
                variant="outline"
                className="h-8 shrink-0"
                aria-label={tExtras("addExtra")}
                onClick={() => setIsExtraModalOpen(true)}
              >
                <Plus className="mr-1 h-3 w-3" />
                {tExtras("addExtra")}
              </Button>
            </div>
          </div>
          {totalKcal > 0 && (
            <Progress value={progressPercent} className="h-2" />
          )}
        </div>

        <Button size={"sm"} asChild>
          <Link href={`/plans/${plan._id}`}>{t("goToPlan")}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
