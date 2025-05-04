import { BackButton } from "@/components/back-button";
import type { Id } from "@/convex/_generated/dataModel";
import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { notFound } from "next/navigation";
import { MealPlanDetail } from "./MealPlanDetailClient";
import { getTranslations } from "next-intl/server";

interface PlanDetailPageProps {
  params: Promise<{ id: Id<"mealPlans"> }>;
}

export default async function PlanDetailPage({ params }: PlanDetailPageProps) {
  const planId = (await params).id;

  const preloadedMealPlan = await preloadQuery(api.mealPlans.getMealPlan, {
    mealPlanId: planId,
  });

  if (!preloadedMealPlan) {
    notFound();
  }

  const t = await getTranslations("mealPlanDetail");

  return (
    <div className="container mx-auto space-y-4 py-8 px-4">
      <BackButton />
      <h1 className="text-3xl font-bold">{t("header")}</h1>
      <MealPlanDetail preloadedMealPlan={preloadedMealPlan} />
    </div>
  );
}
