"use client";

import { type Preloaded, usePreloadedQuery } from "convex/react";
import { format } from "date-fns";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { api } from "@/convex/_generated/api";
import { useDateLocale } from "@/hooks/use-date-locale";

type Props = {
  preloadedPlans: Preloaded<typeof api.plans.getMealPlans>;
};

export function PlanList({ preloadedPlans }: Props) {
  const plans = usePreloadedQuery(preloadedPlans);
  const dateLocale = useDateLocale();
  const t = useTranslations("planList");

  return (
    <>
      {plans.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400">
          {t("noMealPlans")}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan._id}
              className="flex justify-between gap-8 rounded-lg bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:bg-neutral-900 dark:shadow-neutral-700"
            >
              <div className="space-y-2">
                <h2 className="font-semibold text-2xl">
                  {format(plan.date, "MMMM d, yyyy", { locale: dateLocale })}
                </h2>
                <div className="space-y-1">
                  <p className="text-neutral-500 text-xs dark:text-neutral-400">
                    {t("createdAt")}:{" "}
                    {format(plan.createdAt, "MMMM d, yyyy", {
                      locale: dateLocale,
                    })}
                  </p>

                  <p className="text-neutral-500 text-xs dark:text-neutral-400">
                    {t("lastUpdate")}:{" "}
                    {format(plan.updatedAt, "MMMM d, yyyy", {
                      locale: dateLocale,
                    })}
                  </p>
                </div>
              </div>

              <Button
                asChild
                variant="outline"
                className="h-full flex-1"
                size="sm"
              >
                <Link href={`/plans/${plan._id}`}>{t("viewPlan")}</Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
