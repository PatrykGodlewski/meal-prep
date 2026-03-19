"use client";

import { useTranslations } from "next-intl";
import { Progress } from "@/components/ui/progress";

export type DailyGoals = {
  calories: number;
  caloriesGoal: number;
  protein: number;
  proteinGoal: number;
  carbs: number;
  carbsGoal: number;
  fats: number;
  fatsGoal: number;
};

type Props = DailyGoals;

function progressPercent(current: number, goal: number) {
  if (goal <= 0) return 0;
  return Math.min(100, Math.round((current / goal) * 100));
}

export function DailySummary({
  calories,
  caloriesGoal,
  protein,
  proteinGoal,
  carbs,
  carbsGoal,
  fats,
  fatsGoal,
}: Props) {
  const t = useTranslations("personalizedDiet");

  return (
    <div className="flex flex-col gap-4 overflow-hidden rounded-2xl border border-border/60 bg-card/80 p-4 shadow-[var(--shadow-soft)]">
      <h3 className="font-semibold text-base">{t("targetsTitle")}</h3>
      <div className="space-y-4">
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-muted-foreground">{t("dailyTarget")}</span>
            <span className="font-medium">
              {calories} / {caloriesGoal} kcal
            </span>
          </div>
          <Progress value={progressPercent(calories, caloriesGoal)} />
        </div>
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-muted-foreground">{t("protein")}</span>
            <span className="font-medium">
              {protein} / {proteinGoal} g
            </span>
          </div>
          <Progress value={progressPercent(protein, proteinGoal)} />
        </div>
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-muted-foreground">{t("carbs")}</span>
            <span className="font-medium">
              {carbs} / {carbsGoal} g
            </span>
          </div>
          <Progress value={progressPercent(carbs, carbsGoal)} />
        </div>
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-muted-foreground">{t("fat")}</span>
            <span className="font-medium">
              {fats} / {fatsGoal} g
            </span>
          </div>
          <Progress value={progressPercent(fats, fatsGoal)} />
        </div>
      </div>
    </div>
  );
}
