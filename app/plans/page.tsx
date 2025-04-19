import React from "react";
import { mealPlans } from "@/supabase/schema";
import { desc, eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { authorize } from "@/lib/authorization";
import { db } from "@/supabase";
import Link from "next/link";

export default async function WeeklyPlanPage() {
  const user = await authorize("/plans");

  const plans = await db.query.mealPlans.findMany({
    where: eq(mealPlans.userId, user.id),
    orderBy: [desc(mealPlans.date)],
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Meal Plans</h1>
      </div>

      {plans.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400">
          No meal plans found. Start by creating one!
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white dark:bg-neutral-800 rounded-lg shadow p-4 hover:shadow-md transition-shadow"
            >
              <h2 className="text-xl font-semibold mb-2">
                Plan for: {plan.date}
              </h2>
              <Button asChild variant="outline" size="sm">
                <Link href={`/plans/${plan.id}`}>View Plan</Link>
              </Button>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                Plan ID: {plan.id}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
