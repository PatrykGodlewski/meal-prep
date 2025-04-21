import React from "react";
import { api } from "@/convex/_generated/api";
import { preloadQuery } from "convex/nextjs";
import { notFound } from "next/navigation";
import { PlanList } from "./PlanList";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";

export default async function WeeklyPlanPage() {
  const preloadedPlans = await preloadQuery(
    api.mealPlans.getMealPlans,
    {},
    { token: await convexAuthNextjsToken() },
  );

  if (!preloadedPlans) {
    // TODO: check if should be early returned
    return notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Meal Plans</h1>
      </div>
      <PlanList preloadedPlans={preloadedPlans} />
    </div>
  );
}
