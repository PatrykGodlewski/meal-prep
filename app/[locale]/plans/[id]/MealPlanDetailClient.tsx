"use client";
import { useConvexMutation } from "@convex-dev/react-query";
import { type Preloaded, usePreloadedQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Check, Flame, Minus, Plus, UtensilsCrossed } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { For } from "@/components/for-each";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { MEAL_CATEGORIES } from "@/convex/schema";
import { ModalMeals } from "@/features/meal-planner/ModalMeals";
import { useMealPlanner } from "@/features/meal-planner/store";
import { getExtraKcal, getPlanTotals } from "@/lib/plan-kcal";
import { cn } from "@/lib/utils";

interface Props {
  preloadedMealPlan: Preloaded<typeof api.plans.getMealPlan>;
}

export function MealPlanDetail({ preloadedMealPlan }: Props) {
  const mealPlan = usePreloadedQuery(preloadedMealPlan);
  const { servings } = useMealPlanner();
  const t = useTranslations("mealPlanDetail");
  const tExtras = useTranslations("planExtras");
  const addExtraMutation = useConvexMutation(api.plans.addPlanExtra);
  const removeExtraMutation = useConvexMutation(api.plans.removePlanExtra);
  const [isExtraModalOpen, setIsExtraModalOpen] = useState(false);

  if (!mealPlan) {
    return (
      <p className="text-center text-gray-500 dark:text-gray-400">
        {t("noMealPlanDetails")}
        <Button variant="outline" size="sm" asChild className="mt-2">
          <Link href="/">{t("createMealPlan")}</Link>
        </Button>
      </p>
    );
  }

  const plannedMealsByMealCategory = new Map(
    MEAL_CATEGORIES.map((category) => [
      category,
      mealPlan.planMeals.find(
        (plannedMeal) =>
          plannedMeal?.category?.toLowerCase() === category.toLowerCase(),
      ),
    ]),
  );

  const sortedPlannedMeals = Array.from(
    plannedMealsByMealCategory.entries(),
  ).sort(([categoryA], [categoryB]) => {
    return (
      MEAL_CATEGORIES.indexOf(categoryA) - MEAL_CATEGORIES.indexOf(categoryB)
    );
  });

  const { total: totalKcal, eaten: eatenKcal } = getPlanTotals(
    mealPlan.planMeals,
    servings,
    mealPlan.planExtras,
  );
  const progressPercent =
    totalKcal > 0
      ? Math.min(100, Math.round((eatenKcal / totalKcal) * 100))
      : 0;

  const handleExtraMealSelect = async (mealId: Id<"meals">) => {
    await addExtraMutation({ planId: mealPlan.mealPlan._id, mealId });
    setIsExtraModalOpen(false);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Kcal summary & progress */}
      <div className="rounded-lg border bg-muted/50 p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <p className="flex items-center gap-2 font-medium text-sm">
            <Flame className="h-4 w-4" />
            {eatenKcal}/{totalKcal} kcal consumed
          </p>
          <Button
            size="sm"
            variant="outline"
            aria-label={tExtras("addExtra")}
            onClick={() => setIsExtraModalOpen(true)}
          >
            <Plus className="mr-1 h-4 w-4" />
            {tExtras("addExtra")}
          </Button>
        </div>
        <ModalMeals
          isOpen={isExtraModalOpen}
          onOpenChange={setIsExtraModalOpen}
          onMealSelect={handleExtraMealSelect}
        />
        {mealPlan.planExtras && mealPlan.planExtras.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {mealPlan.planExtras.map((extra) => {
              const extraKcal = getExtraKcal(extra);
              return (
                <span
                  key={extra._id}
                  className="flex items-center gap-1 rounded-lg border border-dashed bg-muted px-2 py-1 text-xs"
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
                    onClick={() =>
                      removeExtraMutation({ planExtraId: extra._id })
                    }
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                </span>
              );
            })}
          </div>
        )}
        {totalKcal > 0 && <Progress value={progressPercent} className="h-3" />}
      </div>
      <For each={sortedPlannedMeals}>
        {([category, plannedMeal]) => (
          <MealCard
            key={category}
            category={category}
            plannedMeal={plannedMeal}
            plan={mealPlan}
          />
        )}
      </For>
    </div>
  );
}

interface MealCardProps {
  plannedMeal?: NonNullable<
    FunctionReturnType<typeof api.plans.getMealPlan>
  >["planMeals"][number];
  category: (typeof MEAL_CATEGORIES)[number];
  plan: NonNullable<FunctionReturnType<typeof api.plans.getMealPlan>>;
}

function MealCard({ plannedMeal, category, plan }: MealCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const t = useTranslations("mealPlanDetail");
  const tMeal = useTranslations("meal");
  const tPlanner = useTranslations("mealPlanner");

  const mealPlanMutation = useConvexMutation(
    api.plans.updatePlannedMealByCategory,
  );
  const markEatenMutation = useConvexMutation(api.plans.markPlanMealAsEaten);

  const handleMealSelected = async (mealId: Id<"meals">) => {
    await mealPlanMutation({
      date: plan.mealPlan.date,
      category: category,
      newMealId: mealId,
    });
  };

  const isMeal = plannedMeal?.meal?.name;
  const isEaten = !!plannedMeal?.eatenAt;

  return (
    <div
      className={cn("flex flex-col gap-4 rounded-md border p-4 shadow-sm ", {
        "": isMeal,
        "border-2 border-dashed text-neutral-500": !isMeal,
      })}
    >
      <ModalMeals
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onMealSelect={handleMealSelected}
        filter={category}
        // Optionally provide a trigger if you don't want external control button
        // trigger={<Button>Select Meal</Button>}
      />
      <div className="flex gap-4">
        {plannedMeal?.meal?.imageUrl ? (
          <div className={cn("relative size-32", isEaten && "opacity-60")}>
            <Image
              alt={plannedMeal.meal.name}
              fill
              className="rounded-lg object-cover"
              priority
              src={plannedMeal.meal.imageUrl}
            />
          </div>
        ) : (
          <div
            className={
              "grid size-32 place-content-center rounded-lg border border-dashed dark:border-neutral-800 dark:bg-neutral-900"
            }
          >
            <UtensilsCrossed className="h-8 w-8 text-neutral-300 dark:text-neutral-800" />
          </div>
        )}
        <div className="flex flex-col">
          {plannedMeal?.meal?._id ? (
            <Link href={`/meals/${plannedMeal?.meal?._id}`}>
              <h3 className="font-semibold text-lg hover:underline">
                {plannedMeal?.meal?.name}
              </h3>
            </Link>
          ) : (
            <h3 className="cursor-pointer font-semibold text-lg hover:underline">
              {t("missingMeal")}
            </h3>
          )}
          <p className="text-neutral-400 text-sm uppercase">
            {tMeal(category)}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        {plannedMeal?._id && (
          <Button
            size="icon"
            variant={isEaten ? "default" : "outline"}
            aria-label={
              isEaten ? tPlanner("unmarkAsEaten") : tPlanner("markAsEaten")
            }
            onClick={() =>
              markEatenMutation({
                planMealId: plannedMeal._id,
                eaten: !isEaten,
              })
            }
          >
            <Check className="h-4 w-4" />
          </Button>
        )}
        <Button
          className="flex-1"
          onClick={() => setIsModalOpen(true)}
          variant="outline"
        >
          {t("changeMeal")}
        </Button>
      </div>
    </div>
  );
}
