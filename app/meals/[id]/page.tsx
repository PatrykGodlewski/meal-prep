import { db } from "@/supabase"; // Adjust import
import { meals } from "@/supabase/schema"; // Adjust import
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import MealDetailView from "@/components/details-meal";
import { getAllIngredients } from "@/app/actions";

const getMealById = async (mealId: string) => {
  try {
    const mealWithIngredients = await db.query.meals.findFirst({
      where: eq(meals.id, mealId),
      with: {
        mealIngredients: {
          with: {
            ingredient: true,
          },
        },
      },
    });

    if (!mealWithIngredients) {
      console.log(`No meal found with id: ${mealId}`);
      return null;
    }

    return mealWithIngredients;
  } catch (error) {
    console.error("Error fetching meal with ingredients:", error);
    throw error;
  }
};

export type MealDetails = NonNullable<Awaited<ReturnType<typeof getMealById>>>;

export default async function MealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const mealId = (await params).id;

  if (!mealId) {
    notFound();
  }

  const pageData = await getMealById(mealId);

  if (!pageData) {
    notFound();
  }

  return (
    <MealDetailView
      pageData={pageData}
      ingredientList={(await getAllIngredients()) ?? []}
    />
  );
}
