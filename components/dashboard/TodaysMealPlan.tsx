"use client";

import { RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  ACCENT_PRESETS,
  DEFAULT_TIMES,
  MealCard,
} from "@/features/diet/MealCard";
import type { DietOutput } from "@/lib/validations/diet";

const MEAL_LABELS = ["Breakfast", "Lunch", "Dinner", "Snack", "Other"];

function estimateCalories(p: number, c: number, f: number) {
  return Math.round(4 * p + 4 * c + 9 * f);
}

type Props = {
  diet: DietOutput;
  onRegenerate?: () => void;
};

export function TodaysMealPlan({ diet, onRegenerate }: Props) {
  const t = useTranslations("personalizedDiet");
  const proteinPerMeal = Math.round(
    diet.targets.proteinGrams / diet.meals.length,
  );
  const carbsPerMeal = Math.round(diet.targets.carbGrams / diet.meals.length);
  const fatPerMeal = Math.round(diet.targets.fatGrams / diet.meals.length);
  const caloriesPerMeal = estimateCalories(
    proteinPerMeal,
    carbsPerMeal,
    fatPerMeal,
  );

  const totalCalories = diet.meals.length * caloriesPerMeal;
  const totalProtein = diet.meals.length * proteinPerMeal;
  const totalCarbs = diet.meals.length * carbsPerMeal;
  const totalFats = diet.meals.length * fatPerMeal;

  return (
    <section className="diet-print-content space-y-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-extrabold text-foreground text-xl">
            {t("mealsTitle")}
          </h2>
          <p className="mt-0.5 text-muted-foreground text-sm">
            <span className="font-semibold text-foreground">
              {totalCalories}
            </span>{" "}
            kcal
            <span className="mx-1.5 text-border">|</span>
            <span className="font-semibold text-primary">{totalProtein}g</span>{" "}
            protein
            <span className="mx-1.5 text-border">|</span>
            <span>{totalCarbs}g</span> carbs
            <span className="mx-1.5 text-border">|</span>
            <span>{totalFats}g</span> fats
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onRegenerate && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRegenerate}
              className="gap-1.5 text-muted-foreground hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("regenerate")}</span>
            </Button>
          )}
          <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 font-semibold text-primary text-xs">
            {diet.meals.length} meals
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {diet.meals.map((meal, idx) => {
          const preset = ACCENT_PRESETS[idx % ACCENT_PRESETS.length];
          const macros = {
            calories: caloriesPerMeal,
            protein: proteinPerMeal,
            carbs: carbsPerMeal,
            fats: fatPerMeal,
          };
          const prepTime =
            meal.prepTimeMins != null
              ? t("prepTime", { mins: meal.prepTimeMins })
              : "—";
          const scheduledTime =
            DEFAULT_TIMES[idx % DEFAULT_TIMES.length] ?? "12:00";

          return (
            <MealCard
              key={idx}
              meal={meal}
              mealType={MEAL_LABELS[idx] ?? MEAL_LABELS[4]}
              macros={macros}
              prepTime={prepTime}
              accentColor={preset.accentColor}
              accentBg={preset.accentBg}
              scheduledTime={scheduledTime}
              isLast={idx === diet.meals.length - 1}
              onSwap={() => {}}
            />
          );
        })}
      </div>
    </section>
  );
}
