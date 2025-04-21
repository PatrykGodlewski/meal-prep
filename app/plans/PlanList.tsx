"use client";

import { Button } from "@/components/ui/button";
import type { api } from "@/convex/_generated/api";
import { usePreloadedQuery, type Preloaded } from "convex/react";
import { format } from "date-fns";
import Link from "next/link";

type Props = {
  preloadedPlans: Preloaded<typeof api.mealPlans.getMealPlans>;
};

export function PlanList({ preloadedPlans }: Props) {
  const plans = usePreloadedQuery(preloadedPlans);

  return (
    <>
      {plans.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400">
          No meal plans found. Start by creating one!
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan._id}
              className="bg-white flex justify-between dark:bg-neutral-900 gap-8 rounded-lg shadow p-4 hover:shadow-md dark:shadow-neutral-700 transition-shadow"
            >
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold">
                  {format(plan.date, "MMMM d, yyyy")}
                </h2>
                <div className="space-y-1">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Created at: {format(plan.createdAt, "MMMM d, yyyy")}
                  </p>

                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Last update: {format(plan.updatedAt, "MMMM d, yyyy")}
                  </p>
                </div>
              </div>

              <Button
                asChild
                variant="outline"
                className="flex-1 h-full"
                size="sm"
              >
                <Link href={`/plans/${plan._id}`}>View Plan</Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
