"use client";
import { For } from "@/components/for-each";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { MEAL_CATEGORIES } from "@/convex/schema";
import { cn } from "@/lib/utils";
import { useConvexMutation } from "@convex-dev/react-query";
import { type Preloaded, usePreloadedQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { UtensilsCrossed } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ModalMeals } from "./ModalMeals";

interface Props {
  preloadedMealPlan: Preloaded<typeof api.plans.getMealPlan>;
}

export function MealPlanDetail({ preloadedMealPlan }: Props) {
  const mealPlan = usePreloadedQuery(preloadedMealPlan);
  const t = useTranslations("mealPlanDetail");

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

  return (
    <div className="flex flex-col gap-4">
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

  const mealPlanMutation = useConvexMutation(
    api.plans.updatePlannedMealByCategory,
  );

  const handleMealSelected = async (mealId: Id<"meals">) => {
    await mealPlanMutation({
      date: plan.mealPlan.date,
      category: category,
      newMealId: mealId,
    });
  };

  const isMeal = plannedMeal?.meal?.name;

  return (
    <div
      className={cn("border flex-col gap-4 p-4 rounded-md shadow-sm flex ", {
        "": isMeal,
        "border-dashed border-2 text-neutral-500": !isMeal,
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
          <div className="relative size-32">
            <Image
              alt={plannedMeal.meal.name}
              fill
              className="object-cover"
              priority
              src={plannedMeal.meal.imageUrl}
            />
          </div>
        ) : (
          <div
            className={
              "size-32 rounded-lg border border-dashed grid place-content-center dark:bg-neutral-900 dark:border-neutral-800"
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
            <h3 className="font-semibold text-lg hover:underline cursor-pointer">
              {t("missingMeal")}
            </h3>
          )}
          <p className="text-sm text-neutral-400 uppercase">
            {tMeal(category)}
          </p>
        </div>
      </div>
      <Button
        className="flex-1"
        onClick={() => setIsModalOpen(true)}
        variant="outline"
      >
        {t("changeMeal")}
      </Button>
    </div>
  );
}
