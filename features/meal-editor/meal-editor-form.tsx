"use client";
import type { Doc } from "@/convex/_generated/dataModel";
import MealForm from "./meal-form";
import type { Meal } from "./types";

interface MealEditFormProps {
  meal: Meal;
  availableIngredients: Doc<"ingredients">[];
  onSuccess?: () => void;
}

export function MealEditForm({
  availableIngredients = [],
  meal,
  onSuccess,
}: MealEditFormProps) {
  // The props for MealForm are derived from the props of MealEditForm,
  // so we can just pass them through.
  // The availableIngredients are preloaded in the page component.
  return <MealForm preloadedIngredients={availableIngredients} meal={meal} />;
}
