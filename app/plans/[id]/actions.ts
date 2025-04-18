"use server";
import { authorize } from "@/lib/authorization";
import { db } from "@/supabase";
import { plannedMeals } from "@/supabase/schema"; // Import table schema
import { eq } from "drizzle-orm"; // Import eq operator
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * Server action to change the meal assigned to a specific planned meal slot using Drizzle ORM.
 * @param plannedMealId - The ID of the planned_meals record to update.
 * @param newMealId - The ID of the new meal to assign.
 */
export async function changeMeal(plannedMealId: number, newMealId: string) {
  const user = await authorize(); // Ensure user is authorized
  if (!user) redirect("/sign-in");

  if (!plannedMealId || !newMealId) {
    throw new Error("Planned meal ID and new meal ID are required.");
  }

  // TODO: also update shopping list automagically

  try {
    const updatedPlannedMeals = await db
      .update(plannedMeals)
      .set({ mealId: newMealId }) // Drizzle handles timestamp conversion
      .where(eq(plannedMeals.id, plannedMealId)) // Use eq operator and schema field
      .returning({
        // TODO: might fail this date created At
        date: plannedMeals.createdAt,
        mealPlanId: plannedMeals.mealPlanId,
        mealId: plannedMeals.mealId,
      }); // Select mealPlanId for revalidation

    if (!updatedPlannedMeals || updatedPlannedMeals.length === 0) {
      throw new Error("Planned meal not found or update failed.");
    }

    const updatedData = updatedPlannedMeals[0]; // Drizzle returns an array

    // Revalidate the detail page path to refresh the data
    revalidatePath(`/plans/${updatedData.mealPlanId}`);
    revalidatePath("/");

    console.log(
      `Successfully changed meal for planned_meal ${plannedMealId} to ${newMealId}`,
    );
    // No return value needed, revalidation handles UI update
  } catch (error) {
    console.error("Drizzle error changing meal:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to change meal: ${error.message}`);
    }
    throw new Error("An unknown error occurred while changing the meal.");
  }
}
