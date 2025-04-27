"use client";
import { For } from "@/components/for-each";
import { usePreloadedQuery, type Preloaded } from "convex/react";
import Link from "next/link";
import { useConvexMutation, useConvexQuery } from "@convex-dev/react-query";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import type { FunctionReturnType } from "convex/server";
import { ModalMeals } from "./ModalMeals";
import { useState } from "react";
import type { Id } from "@/convex/_generated/dataModel";
import { MEAL_CATEGORIES } from "@/convex/schema";
import { cn } from "@/lib/utils";

interface Props {
  preloadedMealPlan: Preloaded<typeof api.mealPlans.getMealPlan>;
}

export function MealPlanDetail({ preloadedMealPlan }: Props) {
  const mealPlan = usePreloadedQuery(preloadedMealPlan);

  if (!mealPlan) {
    return (
      <p className="text-center text-gray-500 dark:text-gray-400">
        No meal plan found. Start by creating one!
        <Button variant="outline" size="sm" asChild className="mt-2">
          <Link href="/">Create a Meal Plan</Link>
        </Button>
      </p>
    );
  }

  const plannedMealsByMealCategory = new Map(
    MEAL_CATEGORIES.map((category) => [
      category,
      mealPlan.plannedMeals.find(
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
    FunctionReturnType<typeof api.mealPlans.getMealPlan>
  >["plannedMeals"][number];
  category: (typeof MEAL_CATEGORIES)[number];
  plan: NonNullable<FunctionReturnType<typeof api.mealPlans.getMealPlan>>;
}

function MealCard({ plannedMeal, category, plan }: MealCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const mealPlanMutation = useConvexMutation(
    api.mealPlans.updatePlannedMealByCategory,
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
      className={cn(
        "border p-4 rounded-md shadow flex justify-between items-center",
        {
          "": isMeal,
          "border-dashed border-2 text-neutral-500": !isMeal,
        },
      )}
    >
      <ModalMeals
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onMealSelect={handleMealSelected}
        filter={category}
        // Optionally provide a trigger if you don't want external control button
        // trigger={<Button>Select Meal</Button>}
      />
      <div>
        {plannedMeal?.meal?._id ? (
          <Link href={`/meals/${plannedMeal?.meal?._id}`}>
            <h3 className="font-semibold text-lg hover:underline h-[1lh]">
              {plannedMeal?.meal?.name}
            </h3>
          </Link>
        ) : (
          <h3 className="font-semibold text-lg hover:underline h-[1lh] cursor-pointer">
            {"Missing meal, add one!"}
          </h3>
        )}
        <p className="text-sm text-neutral-400 uppercase">{category}</p>
      </div>
      <Button onClick={() => setIsModalOpen(true)} variant="outline">
        Change Meal
      </Button>
    </div>
  );
}
