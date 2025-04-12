// app/meal-plans/[id]/page.tsx
import { notFound } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/supabase"; // Adjust import
import {
  meals,
  mealPlans,
  plannedMeals,
  type Meal,
  type MealPlan,
  type PlannedMeal,
  type MealCategory, // Import enum type if needed by client type
} from "@/supabase/schema"; // Adjust import
import { authorize } from "@/lib/authorization"; // Adjust import
import { MealPlanEditForm } from "@/components/meal-plan-edit-form"; // Adjust import path

async function getMealPlanForEdit(planId: number) {
  const user = await authorize();

  if (!user) {
    return null;
  }

  const userId = user?.id;

  try {
    const mealPlan = await db.query.mealPlans.findFirst({
      where: and(
        eq(mealPlans.id, planId),
        eq(mealPlans.userId, userId), // Ensure ownership
      ),
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

    if (!mealPlan) {
      console.log(
        `Meal plan with ID ${planId} not found or not owned by user ${userId}.`,
      );
      return null;
    }

    // Fetch all available meals for the select dropdowns
    // Select only necessary fields to keep payload small
    const availableMeals = await db.query.meals.findMany({
      columns: {
        id: true,
        name: true,
        category: true,
      },
      // Optionally add where clause if user should only see their own meals
      // where: eq(meals.createdBy, userId),
      orderBy: (mealsTable, { asc }) => [asc(mealsTable.name)],
    });

    return {
      mealPlan,
      plannedMeals,
      availableMeals,
    };
  } catch (error) {
    console.error(
      `Error fetching meal plan edit data for ID ${planId}:`,
      error,
    );
    return null; // Return null on error
  }
}

// --- Server Component ---
export default async function EditMealPlanPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await authorize();
  if (!user?.id) {
    notFound();
  }
  const planId = Number.parseInt(params.id);

  const pageData = await getMealPlanForEdit(planId);

  if (!pageData) {
    notFound();
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Edit Meal Plan</h1>
      {/* Pass fetched data to the client form component */}
      <MealPlanEditForm pageData={pageData} />
    </div>
  );
}
