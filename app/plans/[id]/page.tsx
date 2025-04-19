import { notFound, redirect } from "next/navigation";
import { authorize } from "@/lib/authorization";
import { db } from "@/supabase";
import { mealPlans } from "@/supabase/schema";
import { and, eq } from "drizzle-orm";
import { getMeals } from "@/app/actions";
import { MealPlanDetailClient } from "./MealPlanDetailClient";
import type { InferAction } from "@/features/meal-planner/actions";
import { BackButton } from "@/components/back-button";
// import { db } from "@/supabase"; // Potentially needed for fetching all meals later
// import { meals } from "@/supabase/schema";
// import { eq } from "drizzle-orm";

async function getMealPlanDetails(planId: number) {
  const user = await authorize();
  if (!user) {
    redirect(`/sign-in?redirect=/plans/${planId}`);
  }
  try {
    const plan = await db.query.mealPlans.findFirst({
      where: and(eq(mealPlans.id, planId), eq(mealPlans.userId, user.id)),
      with: {
        plannedMeals: {
          with: {
            meal: {
              columns: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
        },
      },
    });

    return plan ?? null;
  } catch (error) {
    console.error("Error fetching meal plan details:", error);
    // Decide how to handle DB errors, maybe rethrow or return null
    return null;
  }
}

export type MealPlanDetails = InferAction<typeof getMealPlanDetails>;

interface PlanDetailPageProps {
  params: Promise<{ id: number }>;
}

export default async function PlanDetailPage({ params }: PlanDetailPageProps) {
  const planId = (await params).id;
  const user = await authorize();
  if (!user) {
    redirect(`/sign-in?redirect=/plans/${planId}`);
  }

  const planData = await getMealPlanDetails(planId);
  const allMeals = await getMeals();

  // If planData is null, it means not found or not authorized
  if (!planData) {
    notFound();
  }

  // TODO: Fetch list of all available meals for the "Add Meal" functionality
  // Consider filtering by user or public status, and potentially pagination
  // const allMeals = await db.query.meals.findMany({
  //   where: or(eq(meals.createdBy, user.id), eq(meals.isPublic, true)),
  //   orderBy: (meals, { asc }) => [asc(meals.name)],
  // });

  return (
    <div className="container mx-auto space-y-4 py-8 px-4">
      <BackButton />
      <h1 className="text-3xl font-bold">Meal Plan Details</h1>
      {/* Pass fetched data to the client component */}
      <MealPlanDetailClient initialPlanData={planData} allMeals={allMeals} />
    </div>
  );
}
