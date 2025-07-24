"use client";

import type { api } from "@/convex/_generated/api";
import type { Preloaded } from "convex/react";
import { usePreloadedQuery } from "convex/react";
import { MealForm } from "./meal-form";

type Props = {
  preloadedIngredients: Preloaded<
    typeof api.ingredients.queries.getIngredients
  >;
};

export default function AddMealForm({ preloadedIngredients }: Props) {
  const availableIngredients = usePreloadedQuery(preloadedIngredients);
  return <MealForm availableIngredients={availableIngredients} />;
}
