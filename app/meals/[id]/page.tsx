// app/meals/[id]/page.tsx
import MealDetailView from "@/components/details-meal";
import { db } from "@/supabase";
import {
  type Ingredient,
  ingredients,
  type Meal,
  meals,
  profiles,
} from "@/supabase/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Define the extended meal type with ingredients and author
type MealWithDetails = Meal & {
  ingredients: Ingredient[];
  authorName: string;
};

async function getMeal(id: string): Promise<MealWithDetails | null> {
  try {
    // Fetch the meal
    const mealData = await db
      .select()
      .from(meals)
      .where(eq(meals.id, id))
      .limit(1);

    if (!mealData.length) {
      return null;
    }

    const meal = mealData[0];

    // Fetch ingredients
    const mealIngredients = await db
      .select()
      .from(ingredients)
      .where(eq(ingredients.mealId, meal.id));

    // Fetch author profile if available
    let authorName = "Unknown";
    if (meal.createdBy) {
      const authorProfile = await db
        .select()
        .from(profiles)
        .where(eq(profiles.userId, meal.createdBy))
        .limit(1);

      if (authorProfile.length > 0 && authorProfile[0].nickname) {
        authorName = authorProfile[0].nickname;
      }
    }

    return {
      ...meal,
      ingredients: mealIngredients,
      authorName,
    };
  } catch (error) {
    console.error("Error fetching meal:", error);
    return null;
  }
}

export default async function MealDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const meal = await getMeal(params.id);

  if (!meal) {
    notFound();
  }

  return <MealDetailView meal={meal} />;
}
