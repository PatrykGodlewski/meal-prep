import { BackButton } from "@/components/back-button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { preloadQuery } from "convex/nextjs";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { MealPlanDetail } from "./MealPlanDetailClient";

interface PlanDetailPageProps {
  params: Promise<{ id: Id<"plans"> }>;
}

export default async function PlanDetailPage({ params }: PlanDetailPageProps) {
  const planId = (await params).id;

  const preloadedMealPlan = await preloadQuery(
    api.plans.getMealPlan,
    {
      mealPlanId: planId,
    },
    { token: await convexAuthNextjsToken() },
  );

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
