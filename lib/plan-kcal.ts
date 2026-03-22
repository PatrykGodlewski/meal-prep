import type { Doc } from "@/convex/_generated/dataModel";

type PlanMealWithMeal = {
  _id: string;
  mealId: string;
  meal: Doc<"meals"> | null;
  servingAmount?: number;
  eatenAt?: number | null;
};

export type PlanExtraWithMeal = {
  mealId: string;
  meal: Doc<"meals"> | null;
  servingAmount?: number;
};

export function getExtraKcal(planExtra: PlanExtraWithMeal): number {
  return getMealKcal(
    {
      _id: "",
      mealId: planExtra.mealId,
      meal: planExtra.meal,
      servingAmount: planExtra.servingAmount,
    } as PlanMealWithMeal,
    undefined,
  );
}

export function getMealKcal(
  planMeal: PlanMealWithMeal,
  peopleAmount?: number,
): number {
  const meal = planMeal.meal;
  if (!meal?.calories) return 0;
  const servings = planMeal.servingAmount ?? peopleAmount ?? meal.servings ?? 1;
  return meal.calories * servings;
}

export function getPlanTotals(
  planMeals: PlanMealWithMeal[],
  peopleAmount?: number,
  planExtras?: PlanExtraWithMeal[],
): {
  total: number;
  eaten: number;
} {
  let total = 0;
  let eaten = 0;
  for (const pm of planMeals) {
    const kcal = getMealKcal(pm, peopleAmount);
    total += kcal;
    if (pm.eatenAt) eaten += kcal;
  }
  // Extras (e.g. drinks) are always counted as eaten
  for (const pe of planExtras ?? []) {
    const kcal = getMealKcal(
      { ...pe, eatenAt: 1 } as PlanMealWithMeal,
      undefined,
    );
    total += kcal;
    eaten += kcal;
  }
  return { total, eaten };
}
