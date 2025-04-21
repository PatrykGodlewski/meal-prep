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
import { Id } from "@/convex/_generated/dataModel";

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

  return (
    <div className="flex flex-col gap-4">
      <For
        each={mealPlan.plannedMeals.sort((a, b) =>
          (a.meal?.category ?? "").localeCompare(b.meal?.category ?? ""),
        )}
      >
        {(plannedMeal) => (
          <MealCard key={plannedMeal._id} plannedMeal={plannedMeal} />
        )}
      </For>
    </div>
  );
}

interface MealCardProps {
  plannedMeal: NonNullable<
    FunctionReturnType<typeof api.mealPlans.getMealPlan>
  >["plannedMeals"][number];
}

function MealCard({ plannedMeal }: MealCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const mealPlanMutation = useConvexMutation(
    api.mealPlans.updatePlannedMealByCategory,
  );

  const handleMealSelected = async (mealId: Id<"meals">) => {
    if (!plannedMeal.meal?.category) return;
    await mealPlanMutation({
      category: plannedMeal.meal?.category,
      mealPlanId: plannedMeal.mealPlanId,
      newMealId: mealId,
    });
  };

  return (
    <div className="border p-4 rounded-md shadow flex justify-between items-center">
      <ModalMeals
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onMealSelect={handleMealSelected}
        // TODO: filter should be done on server side
        filter={(meal) => meal.category === plannedMeal.meal?.category}
        // Optionally provide a trigger if you don't want external control button
        // trigger={<Button>Select Meal</Button>}
      />
      <div>
        <Link href={`/meals/${plannedMeal.meal?._id}`}>
          <h3 className="font-semibold text-lg hover:underline">
            {plannedMeal.meal?.name}
          </h3>
        </Link>
        <p className="text-sm text-neutral-400 uppercase">
          {plannedMeal.meal?.category}
        </p>
      </div>
      <Button onClick={() => setIsModalOpen(true)} variant="outline">
        Change Meal
      </Button>
    </div>
  );
}
