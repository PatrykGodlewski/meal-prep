import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { preloadQuery } from "convex/nextjs";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BackButton } from "@/components/back-button";
import ServingController from "@/components/serving-controller";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
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
    <div className="container mx-auto space-y-4 px-4 py-8">
      <BackButton />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-bold text-3xl">{t("header")}</h1>
        <ServingController />
      </div>
      <MealPlanDetail preloadedMealPlan={preloadedMealPlan} />
    </div>
  );
}
