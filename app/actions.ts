"use server";

import type { MealAddFormValues } from "@/features/meal-editor/form-meal";
import type { MealUpdateFormValues } from "@/features/meal-editor/meal-editor-form";
import type { MealPlanClient } from "@/features/meal-planner/types";
import { authorize } from "@/lib/authorization";
import { db } from "@/supabase";
import {
  meals,
  ingredients as ingredientsSchema,
  mealPlans,
  plannedMeals,
  mealsTags,
  type NewIngredient,
  type Meal,
} from "@/supabase/schema";
import { createClient } from "@/utils/supabase/server";
import { encodedRedirect } from "@/utils/utils";
import { addDays, format, startOfWeek } from "date-fns";
import { and, eq, inArray } from "drizzle-orm";
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
export async function addMealAction(data: MealAddFormValues): Promise<Result> {
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

interface DeleteResult {
  success: boolean;
  error?: string;
}

interface UpdateResult {
  success: boolean;
  error?: string;
  mealId?: string; // Optionally return mealId
}

// Define a clear result type
interface UpdateResult {
  success: boolean;
  error?: string;
  mealId?: string; // Optionally return mealId
}

/**
 * Updates a Meal record and synchronizes its associated Ingredients.
 * Handles inserting new ingredients, updating existing ones, and deleting removed ones.
 * Operates within a database transaction.
 * @param data - Validated form data conforming to MealUpdateFormValues.
 * @returns Promise<UpdateResult> indicating success or failure.
 */
export async function updateMeal(
  data: MealUpdateFormValues,
): Promise<UpdateResult> {
  // 1. Input Validation (Basic check, Zod already validated structure)
  if (!data?.id) {
    return { success: false, error: "Invalid meal data: Missing ID." };
  }
  if (!data.ingredients || !Array.isArray(data.ingredients)) {
    return {
      success: false,
      error: "Invalid meal data: Missing ingredients array.",
    };
  }

  const {
    ingredients: submittedIngredients,
    id: mealId,
    ...mealBaseData
  } = data;

  try {
    await db.transaction(async (tx) => {
      // 2. Update Meal Details
      await tx
        .update(meals)
        .set({
          name: mealBaseData.name,
          description: mealBaseData.description,
          instructions: mealBaseData.instructions,
          prepTimeMinutes: mealBaseData.prepTimeMinutes,
          cookTimeMinutes: mealBaseData.cookTimeMinutes,
          servings: mealBaseData.servings,
          category: mealBaseData.category,
          imageUrl: mealBaseData.imageUrl,
          isPublic: mealBaseData.isPublic,
          updatedAt: new Date(),
        })
        .where(eq(meals.id, mealId));

      // 3. Fetch IDs of Existing Ingredients for Comparison
      const existingIngredientIds = (
        await tx
          .select({ id: ingredientsSchema.id })
          .from(ingredientsSchema)
          .where(eq(ingredientsSchema.mealId, mealId))
      ).map((ing) => ing.id); // Get just the array of IDs

      const existingIdSet = new Set(existingIngredientIds);
      const submittedIds = new Set<string>(); // Track IDs submitted that should be kept/updated

      // --- Promises for concurrent execution ---
      const insertPromises: Promise<any>[] = [];
      const updatePromises: Promise<any>[] = [];

      // 4. Process Submitted Ingredients: Prepare Inserts & Updates
      for (const submittedIng of submittedIngredients) {
        // Prepare payload, ensuring required fields are present and optional are null if empty
        // Explicitly type the payload for clarity and safety
        const payload: Omit<NewIngredient, "id" | "mealId" | "createdAt"> = {
          name: submittedIng.name, // Required by schema
          quantity: submittedIng.quantity, // Required by schema
          unit: submittedIng.unit || null,
          category: submittedIng.category || null,
          isOptional: submittedIng.isOptional ?? false,
          notes: submittedIng.notes || null,
        };

        if (submittedIng.id && existingIdSet.has(submittedIng.id)) {
          // --- Prepare UPDATE ---
          submittedIds.add(submittedIng.id); // Mark as present in submission
          updatePromises.push(
            tx
              .update(ingredientsSchema)
              .set(payload)
              .where(eq(ingredientsSchema.id, submittedIng.id)),
          );
        } else {
          // --- Prepare INSERT ---
          // ID is missing or doesn't match an existing one for this meal
          const insertPayload: NewIngredient = {
            ...payload,
            mealId: mealId, // Link to the meal
            // Let DB handle default 'id' and 'createdAt'
          };
          insertPromises.push(
            tx.insert(ingredientsSchema).values(insertPayload),
          );
        }
      }

      // 5. Determine and Prepare Deletes
      const idsToDelete = existingIngredientIds.filter(
        (id) => !submittedIds.has(id),
      );
      let deletePromise: Promise<any> | null = null;
      if (idsToDelete.length > 0) {
        deletePromise = tx
          .delete(ingredientsSchema)
          .where(inArray(ingredientsSchema.id, idsToDelete));
      }

      // 6. Execute DB Operations Concurrently
      const allPromises = [...insertPromises, ...updatePromises];
      if (deletePromise) {
        allPromises.push(deletePromise);
      }
      await Promise.all(allPromises);

      // 7. Revalidate Paths (after successful transaction)
      revalidatePath(`/meals/${mealId}`);
      revalidatePath("/meals");
    }); // Transaction commits here if no errors were thrown

    return { success: true, mealId: mealId };
  } catch (error) {
    console.error("Error updating meal:", { mealId, data, error }); // Log more context
    const message =
      error instanceof Error
        ? error.message
        : "Database error occurred during update.";
    // Consider logging the specific DB error if available (e.g., error.code)
    return { success: false, error: message };
  }
}

// Define a clear result type
interface DeleteResult {
  success: boolean;
  error?: string;
}

/**
 * Deletes a Meal record and its associations in junction tables (plannedMeals, mealsTags).
 * Ingredients associated with the meal will have their mealId set to NULL
 * due to the 'on delete set null' constraint (requires schema modification and migration).
 * @param id - The UUID string of the meal to delete.
 * @returns Promise<DeleteResult> indicating success or failure.
 */
export async function deleteMeal(id: string): Promise<DeleteResult> {
  if (!id) {
    return { success: false, error: "Meal ID is required." };
  }

  try {
    await db.transaction(async (tx) => {
      // 1. Delete associations in plannedMeals table first
      //    (Important if plannedMeals has FK to meals with RESTRICT/NO ACTION)
      await tx.delete(plannedMeals).where(eq(plannedMeals.mealId, id));

      // 2. Delete associations in mealsTags table
      await tx.delete(mealsTags).where(eq(mealsTags.mealId, id));

      // 3. Delete the meal itself
      //    The 'on delete set null' constraint on ingredients.mealId
      //    will automatically handle setting related ingredients' mealId to NULL.
      const deleteResult = await tx
        .delete(meals)
        .where(eq(meals.id, id))
        .returning({ deletedId: meals.id }); // Optional: check if something was deleted

      if (deleteResult.length === 0) {
        // Optional: Throw error if meal wasn't found to trigger rollback
        throw new Error(`Meal with ID ${id} not found for deletion.`);
      }

      // 4. Revalidate relevant paths after successful deletion
      revalidatePath("/meals"); // Revalidate the list page
      // No need to revalidate `/meals/${id}` as it won't exist anymore
    }); // Transaction commits here if no errors were thrown

    return { success: true };
  } catch (error) {
    console.error("Error deleting meal:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Database error occurred during deletion.";
    return { success: false, error: message };
  }
}

// Helper to create base structure (can be moved to utils)
// Returns objects matching MealPlanDayClient structure but with empty meals
const createEmptyWeekStructureForClient = (
  startDate: Date,
): MealPlanClient[] => {
  const mondayStart = startOfWeek(startDate, { weekStartsOn: 1 });
  return Array.from({ length: 7 }).map((_, i) => ({
    date: addDays(mondayStart, i),
    meals: [],
  }));
};

/**
 * Fetches structured meal plan data for the current week for the authorized user.
 * Returns an array of 7 days, including empty days if no plan exists.
 * @returns Promise<MealPlanDayClient[]> - Array of 7 days for the week.
 */
export async function getMealPlansDataForCurrentWeek(
  currentWeek: Date,
): Promise<MealPlanClient[]> {
  // 1. Authorization
  const user = await authorize();
  const startDate = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Calculate start date once

  if (!user?.id) {
    console.error("Authorization failed in getMealPlansDataForCurrentWeek");
    return createEmptyWeekStructureForClient(startDate); // Return empty structure
  }
  const userId = user.id;

  // 2. Calculate Date Range
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
  const weekDateStrings = weekDates.map((date) => format(date, "yyyy-MM-dd"));

  try {
    // 3. Fetch Meal Plans for the User within the Date Range
    const mealPlansResult = await db
      .select({
        id: mealPlans.id,
        date: mealPlans.date, // Keep date string for mapping
      })
      .from(mealPlans)
      .where(
        and(
          eq(mealPlans.userId, userId),
          inArray(mealPlans.date, weekDateStrings),
        ),
      );

    // If no plans exist for the week, return the base structure
    if (mealPlansResult.length === 0) {
      return createEmptyWeekStructureForClient(startDate);
    }

    // 4. Prepare for Fetching Planned Meals
    const mealPlanIdToDateMap = new Map(
      mealPlansResult.map((p) => [p.id, p.date]),
    );
    const mealPlanIds = mealPlansResult.map((p) => p.id);

    // 5. Fetch All Planned Meals for these Plans, Joining with Meals
    const plannedMealsResult = await db
      .select({
        mealPlanId: plannedMeals.mealPlanId,
        meal: meals,
      })
      .from(plannedMeals)
      .innerJoin(meals, eq(plannedMeals.mealId, meals.id))
      .where(inArray(plannedMeals.mealPlanId, mealPlanIds));

    // 6. Group Planned Meals by Date String
    const mealsGroupedByDate = new Map<string, Meal[]>();
    for (const { mealPlanId, meal } of plannedMealsResult) {
      const dateString = mealPlanIdToDateMap.get(mealPlanId);
      if (!dateString) continue;

      if (mealsGroupedByDate.has(dateString)) {
        mealsGroupedByDate.get(dateString)?.push(meal);
      } else {
        mealsGroupedByDate.set(dateString, [meal]);
      }
    }

    // 7. Construct the Final 7-Day Output (without dayName)
    const finalWeekPlan = weekDates.map((date): MealPlanClient => {
      const dateString = format(date, "yyyy-MM-dd");
      const mealsForDay = mealsGroupedByDate.get(dateString) || [];

      return {
        date, // Use ISO string for client
        meals: mealsForDay,
      };
    });

    // No need to sort by dayName anymore, order comes from weekDates iteration
    return finalWeekPlan;
  } catch (error) {
    console.error("Error fetching meal plan data:", error);
    // Return empty structure on error
    return createEmptyWeekStructureForClient(startDate);
  }
}
