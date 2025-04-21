"use client";
import { For } from "@/components/for-each";
import { usePreloadedQuery, type Preloaded } from "convex/react";
import Link from "next/link";
import {} from "@convex-dev/react-query";
import type { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import type { FunctionReturnType } from "convex/server";

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
  return (
    <div className="border p-4 rounded-md shadow flex justify-between items-center">
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
    </div>
  );
}
