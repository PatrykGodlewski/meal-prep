"use client";
import type { Doc } from "@/convex/_generated/dataModel";
import { MealForm } from "./meal-form";
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
  return (
    <MealForm
      availableIngredients={availableIngredients}
      meal={meal}
      onSuccess={onSuccess}
    />
  );
}
