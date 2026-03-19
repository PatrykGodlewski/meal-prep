"use client";

import { useMutation, useQuery } from "convex/react";
import { Loader2, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import {
  DailySummary,
  DashboardHeader,
  ShoppingList,
  TodaysMealPlan,
  WeekDaysNav,
  WelcomeBanner,
} from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import type { DietOutput } from "@/lib/validations/diet";

export function DietPageClient() {
  const t = useTranslations("personalizedDiet");
  const locale = useLocale();
  const dietDoc = useQuery(api.diet.queries.getDietForUser);
  const requestDietGeneration = useMutation(
    api.diet.mutations.requestDietGeneration,
  );
  const [selectedDay, setSelectedDay] = useState<Date>(() => new Date());

  const isPending =
    dietDoc?.status === "pending" || dietDoc?.status === "running";
  const isCompleted = dietDoc?.status === "completed";
  const isFailed = dietDoc?.status === "failed";
  const hasNoDiet =
    !dietDoc || (dietDoc.status !== "completed" && !isPending && !isFailed);

  const handleGenerate = () => {
    requestDietGeneration({ locale });
  };

  if (dietDoc === undefined) {
    return (
      <div className="grid min-h-[320px] place-items-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="grid min-h-[360px] place-items-center">
        <div className="flex flex-col items-center gap-6">
          <div className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-[var(--shadow-card)]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
          <p className="text-muted-foreground">{t("generating")}</p>
        </div>
      </div>
    );
  }

  if (hasNoDiet || isFailed) {
    return (
      <div className="grid place-items-center py-12">
        <Card className="glass-card w-full max-w-lg overflow-hidden rounded-3xl border border-border/60 shadow-[var(--shadow-elevated)]">
          <CardContent className="flex flex-col items-center gap-6 p-10 text-center">
            <div className="rounded-2xl bg-primary/10 p-4">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h2 className="mb-2 font-semibold text-xl">{t("emptyTitle")}</h2>
              <p className="text-muted-foreground text-sm">
                {isFailed
                  ? (dietDoc?.error ?? t("errorGeneric"))
                  : t("emptyDescription")}
              </p>
            </div>
            <Button
              size="lg"
              onClick={handleGenerate}
              className="rounded-2xl px-8 shadow-[var(--shadow-soft)]"
            >
              {isFailed ? t("tryAgain") : t("generateFirstPlan")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isCompleted && dietDoc.result) {
    const diet = dietDoc.result as DietOutput;
    const targets = diet.targets;

    const dailyGoals = {
      calories: 0,
      caloriesGoal: targets.dailyKcalTarget,
      protein: 0,
      proteinGoal: targets.proteinGrams,
      carbs: 0,
      carbsGoal: targets.carbGrams,
      fats: 0,
      fatsGoal: targets.fatGrams,
    };

    return (
      <>
        <DashboardHeader
          onRegenerate={handleGenerate}
          onPrint={() => window.print()}
        />

        <main className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {/* Welcome Banner */}
          <div className="mb-6">
            <WelcomeBanner />
          </div>

          {/* Week days navigation */}
          <div className="mb-6">
            <WeekDaysNav value={selectedDay} onChange={setSelectedDay} />
          </div>

          {/* Main 2-column layout */}
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_360px]">
            {/* Left: Today's meal plan */}
            <TodaysMealPlan diet={diet} onRegenerate={handleGenerate} />

            {/* Right sidebar: Daily summary + Shopping list */}
            <div className="flex flex-col gap-4 lg:sticky lg:top-6">
              <DailySummary {...dailyGoals} />
              <ShoppingList diet={diet} />
            </div>
          </div>
        </main>
      </>
    );
  }

  return null;
}
