"use client";

import type { FunctionReturnType } from "convex/server";
import { useTranslations } from "next-intl";
import { Progress } from "@/components/ui/progress";
import type { api } from "@/convex/_generated/api";
import { getPlanTotals } from "@/lib/plan-kcal";
import { useMealPlanner } from "./store";

type Plan = FunctionReturnType<typeof api.plans.getWeeklyMealPlan>[number];

type Props = {
  plan: Plan | undefined;
};

export function DailyProgress({ plan }: Props) {
  const t = useTranslations("personalizedDiet");
  const { servings } = useMealPlanner();

  const { total: totalKcal, eaten: eatenKcal } = plan?.planMeals
    ? getPlanTotals(plan.planMeals, servings, plan.planExtras)
    : { total: 0, eaten: 0 };

  const progressPercent =
    totalKcal > 0
      ? Math.min(100, Math.round((eatenKcal / totalKcal) * 100))
      : 0;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card/80 p-4 shadow-[var(--shadow-soft)]">
      <h3 className="font-semibold text-base">{t("targetsTitle")}</h3>
      <div className="space-y-4">
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-muted-foreground">{t("dailyTarget")}</span>
            <span className="font-medium">
              {eatenKcal} / {totalKcal} kcal
            </span>
          </div>
          <Progress value={progressPercent} />
        </div>
      </div>
    </div>
  );
}
