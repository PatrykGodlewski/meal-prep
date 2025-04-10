"use server";

import type { MealFormValues } from "@/components/form-meal";
import { MealPlanDay } from "@/components/server-components/week-planner";
import { authorize } from "@/lib/authorization";
import { db } from "@/supabase";
import {
  dayEnum,
  meals,
  ingredients as ingredientsSchema,
  type Meal,
  type Ingredient,
  mealCategoryEnum,
  mealPlans,
  plannedMeals,
} from "@/supabase/schema";
import { createClient } from "@/utils/supabase/server";
import { encodedRedirect } from "@/utils/utils";
import { MealCategory } from "@/validators";
import { addDays, format, getDay, startOfWeek } from "date-fns";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const displayName = formData.get("nickname")?.toString() ?? "MealPrep User";
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Email and password are required",
    );
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        displayName,
      },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error(`${error.code} ${error.message}`);
    return encodedRedirect("error", "/sign-up", error.message);
  }

  return encodedRedirect(
    "success",
    "/sign-up",
    "Thanks for signing up! Please check your email for a verification link.",
  );
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  return redirect("/");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password",
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect("error", "/reset-password", "Passwords do not match");
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect("error", "/reset-password", "Password update failed");
  }

  encodedRedirect("success", "/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};

export const addDisplayNameAction = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const formData = new FormData();
  formData.append("displayName", user.user_metadata.full_name);
  const { error } = await supabase.auth.updateUser({
    data: {
      displayName: formData.get("displayName")?.toString(),
    },
  });
  if (error) {
    console.error(error.message);
    return encodedRedirect("error", "/profile", error.message);
  }
  return redirect("/");
};

type Result = { success: boolean; mealId?: string; error?: string };
export async function addMealAction(data: MealFormValues): Promise<Result> {
  try {
    const user = await authorize();
    if (!user) return { success: false };
    const { ingredients, ...mealData } = data;

    const [newMeal] = await db
      .insert(meals)
      .values({
        ...mealData,
        createdBy: user.id,
      })
      .returning();

    await db.insert(ingredientsSchema).values(
      data.ingredients.map((ingredient) => ({
        ...ingredient,
        mealId: newMeal.id,
      })),
    );

    return { success: true, mealId: newMeal.id };
  } catch (error) {
    console.error("Server error:", error);
    return { success: false, error: "Failed to add meal" };
  }
}
// Define the extended meal type with ingredients and author
type MealWithDetails = Meal & {
  ingredients: (Ingredient | TempIngredient)[];
  authorName: string;
};

// Define a type for temporary ingredients (with string IDs)
type TempIngredient = Omit<Ingredient, "id"> & { id: string };

interface UpdateResult {
  success: boolean;
  error?: string;
}

interface DeleteResult {
  success: boolean;
  error?: string;
}

export async function updateMeal(data: MealWithDetails): Promise<UpdateResult> {
  try {
    // Extract ingredients to handle separately
    const { ingredients: ingredientsData, authorName, ...mealData } = data;

    // Start a transaction
    return await db.transaction(async (tx) => {
      // Update the meal
      await tx
        .update(meals)
        .set({
          name: mealData.name,
          description: mealData.description,
          instructions: mealData.instructions,
          prepTimeMinutes: mealData.prepTimeMinutes,
          cookTimeMinutes: mealData.cookTimeMinutes,
          servings: mealData.servings,
          category: mealData.category,
          imageUrl: mealData.imageUrl,
          isPublic: mealData.isPublic,
          updatedAt: new Date(),
        })
        .where(eq(meals.id, mealData.id));

      // Handle ingredients
      // First, get existing ingredients to compare
      const existingIngredients = await tx
        .select()
        .from(ingredientsSchema)
        .where(eq(ingredientsSchema.mealId, mealData.id));

      // Identify ingredients to delete (those in DB but not in the updated data)
      const existingIds = existingIngredients.map((ing) => ing.id);
      const updatedIds = ingredientsData
        .filter((ing) => !ing.id.toString().startsWith("temp-"))
        .map((ing) => ing.id);

      const idsToDelete = existingIds.filter((id) => !updatedIds.includes(id));

      // Delete removed ingredients
      if (idsToDelete.length > 0) {
        for (const id of idsToDelete) {
          await tx
            .delete(ingredientsSchema)
            .where(eq(ingredientsSchema.id, id));
        }
      }

      // Update or insert ingredients
      for (const ingredient of ingredientsData) {
        // Skip temporary IDs - these are new ingredients
        if (ingredient.id.toString().startsWith("temp-")) {
          // Insert new ingredient
          await tx.insert(ingredientsSchema).values({
            mealId: mealData.id,
            name: ingredient.name,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            isOptional: ingredient.isOptional,
            notes: ingredient.notes,
            createdAt: new Date(),
          });
        } else {
          // Update existing ingredient
          await tx
            .update(ingredientsSchema)
            .set({
              name: ingredient.name,
              quantity: ingredient.quantity,
              unit: ingredient.unit,
              isOptional: ingredient.isOptional,
              notes: ingredient.notes,
            })
            .where(eq(ingredientsSchema.id, ingredient.id as string));
        }
      }

      // Revalidate the page
      revalidatePath(`/meals/${mealData.id}`);
      revalidatePath("/meals");

      return { success: true };
    });
  } catch (error) {
    console.error("Error updating meal:", error);
    return { success: false, error: "Failed to update meal" };
  }
}

export async function deleteMeal(id: string): Promise<DeleteResult> {
  try {
    // Start a transaction
    return await db.transaction(async (tx) => {
      // Delete all ingredients first (should cascade, but being explicit)
      await tx
        .delete(ingredientsSchema)
        .where(eq(ingredientsSchema.mealId, id));

      // Delete the meal
      await tx.delete(meals).where(eq(meals.id, id));

      // Revalidate paths
      revalidatePath("/meals");

      return { success: true };
    });
  } catch (error) {
    console.error("Error deleting meal:", error);
    return { success: false, error: "Failed to delete meal" };
  }
}

export async function generateWeeklyMealPlan(startDate: Date): Promise<void> {
  const user = await authorize();
  if (!user) throw new Error("User not authorized");

  const weekStart = startOfWeek(startDate, { weekStartsOn: 1 }); // Monday
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Fetch all meals from the database
  const allMeals = await db.select().from(meals);

  if (allMeals.length === 0) {
    throw new Error("No meals available in the database to create a plan.");
  }

  const mealsByCategory = Object.groupBy(
    allMeals,
    (meal) => meal.category ?? "uncategorized",
  );

  // Generate and Save Meal Plans for each day of the week
  for (const date of weekDates) {
    const day = format(
      date,
      "EEEE",
    ).toLowerCase() as (typeof dayEnum.enumValues)[number];
    const formattedDate = format(date, "yyyy-MM-dd");

    // Check if a meal plan already exists for this date
    const existingMealPlan = await db
      .select()
      .from(mealPlans)
      .where(
        and(eq(mealPlans.userId, user.id), eq(mealPlans.date, formattedDate)),
      );

    if (existingMealPlan.length > 0) {
      console.log(
        `Meal plan already exists for ${formattedDate}. Skipping generation.`,
      );
      continue; // Skip to the next day
    }

    // Create a new meal plan
    const [newMealPlan] = await db
      .insert(mealPlans)
      .values({
        userId: user.id,
        date: formattedDate,
        day: day,
      })
      .returning();

    if (!newMealPlan) {
      throw new Error(`Failed to create meal plan for ${formattedDate}.`);
    }

    // Assign one meal of each category to the new plan
    const plannedMealsValues = mealCategoryEnum.enumValues.map((category) => {
      const availableMeals = mealsByCategory[category];
      if (!availableMeals || availableMeals.length === 0) {
        throw new Error(
          `No ${category} meals available for ${formattedDate}.  Please add more meals.`,
        );
      }
      // Select a random meal from available meals for category
      // TODO: should be decided by algorithm best desided by preferences and settings and data of person and other THIS IS FEATURE to be implemented
      const randomMeal =
        availableMeals[Math.floor(Math.random() * availableMeals.length)];

      return {
        mealPlanId: newMealPlan.id,
        mealId: randomMeal.id,
        category: category,
      };
    });

    // Save planned meals
    await db.insert(plannedMeals).values(plannedMealsValues);

    console.log(`Generated meal plan for ${formattedDate} successfully.`);
  }

  console.log("Weekly meal plan generated successfully.");
}

export async function getMealPlanForWeek(
  startDate: Date,
): Promise<MealPlanDay[]> {
  const daysOfWeekNames = dayEnum.enumValues;
  // Ensure startDate is actually the Monday of its week
  const mondayStart = startOfWeek(startDate, { weekStartsOn: 1 });
  const weekDates = Array.from({ length: 7 }, (_, i) =>
    addDays(mondayStart, i),
  );

  const mealPlansForWeek = await Promise.all(
    weekDates.map(async (date): Promise<MealPlanDay> => {
      const formattedDate = format(date, "yyyy-MM-dd");
      const dayIndex = getDay(date);
      const dayName = daysOfWeekNames[dayIndex];

      const mealPlanResult = await db
        .select({ id: mealPlans.id })
        .from(mealPlans)
        .where(eq(mealPlans.date, formattedDate))
        .limit(1);

      if (!mealPlanResult || mealPlanResult.length === 0) {
        return { date, dayName, meals: [] };
      }

      const mealPlanId = mealPlanResult[0].id;
      const plannedMealsResult = await db
        .select({
          mealId: plannedMeals.mealId,
          category: plannedMeals.category,
          mealName: meals.name,
        })
        .from(plannedMeals)
        .where(eq(plannedMeals.mealPlanId, mealPlanId))
        .leftJoin(meals, eq(plannedMeals.mealId, meals.id));

      const mealsForDay = plannedMealsResult
        .filter((pm) => pm.mealName !== null)
        .map((pm) => ({
          id: pm.mealId ?? `unknown-${Math.random()}`,
          name: pm.mealName ?? "Meal Not Found",
          category: pm.category as MealCategory,
        }));

      return { date, dayName, meals: mealsForDay };
    }),
  );

  // Ensure Monday-Sunday order
  const sortedPlan = mealPlansForWeek.sort(
    (a, b) => getDay(a.date) - getDay(b.date),
  );
  if (getDay(sortedPlan[0].date) === 0) {
    sortedPlan.push(sortedPlan.shift()!);
  }
  return sortedPlan;
}
