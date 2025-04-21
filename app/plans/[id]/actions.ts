// "use server";
// import { updateWeeklyShoppingList } from "@/features/meal-planner/actions";
// import { authorize, getUser } from "@/lib/authorization";
// import { db } from "@/supabase";
// import { mealPlans, plannedMeals } from "@/supabase/schema"; // Import table schema
// import { eq } from "drizzle-orm"; // Import eq operator
// import { revalidatePath } from "next/cache";
// import { redirect } from "next/navigation";
//
// /**
//  * Server action to change the meal assigned to a specific planned meal slot using Drizzle ORM.
//  * @param plannedMealId - The ID of the planned_meals record to update.
//  * @param newMealId - The ID of the new meal to assign.
//  */
// export async function changeMeal(plannedMealId: number, newMealId: string) {
//   const user = await getUser(); // Ensure user is authorized
//   if (!user) redirect("/sign-in");
//
//   if (!plannedMealId || !newMealId) {
//     throw new Error("Planned meal ID and new meal ID are required.");
//   }
//
//   // TODO: also update shopping list automagically
//
//   try {
//     const updatedPlannedMeals = await db
//       .update(plannedMeals)
//       .set({ mealId: newMealId }) // Drizzle handles timestamp conversion
//       .where(eq(plannedMeals.id, plannedMealId)) // Use eq operator and schema field
//       .returning({
//         mealPlanId: plannedMeals.mealPlanId,
//       }); // Select mealPlanId for revalidation and shopping list update
//
//     if (!updatedPlannedMeals || updatedPlannedMeals.length === 0) {
//       throw new Error("Planned meal not found or update failed.");
//     }
//
//     const updatedData = updatedPlannedMeals[0]; // Drizzle returns an array
//
//     // --- Update Shopping List ---
//     // 1. Get the meal plan date
//     const plan = await db.query.mealPlans.findFirst({
//       where: eq(mealPlans.id, updatedData.mealPlanId),
//       columns: { date: true },
//     });
//
//     if (!plan?.date) {
//       // Handle case where meal plan or date is not found, maybe log an error
//       console.error(
//         `Could not find meal plan date for mealPlanId: ${updatedData.mealPlanId}. Shopping list not updated.`,
//       );
//     } else {
//       // 2. Format the date to yyyy-MM-dd (required by updateWeeklyShoppingList)
//       // Ensure the date from DB is treated correctly (it should be a string like 'YYYY-MM-DD')
//       const planDateStr = plan.date; // Drizzle returns date as string 'YYYY-MM-DD'
//
//       // 3. Call the update function
//       await updateWeeklyShoppingList(planDateStr);
//       console.log(
//         `Triggered shopping list update for the week of meal plan ${updatedData.mealPlanId} (date: ${planDateStr})`,
//       );
//       // Revalidate shopping list path as well
//     }
//     // --- End Update Shopping List ---
//
//     // Revalidate the detail page path to refresh the data
//     revalidatePath(`/plans/${updatedData.mealPlanId}`);
//     revalidatePath("/"); // Revalidate potentially affected dashboard/overview pages
//
//     console.log(
//       `Successfully changed meal for planned_meal ${plannedMealId} to ${newMealId}`,
//     );
//     // No return value needed, revalidation handles UI update
//   } catch (error) {
//     console.error("Drizzle error changing meal:", error);
//     if (error instanceof Error) {
//       throw new Error(`Failed to change meal: ${error.message}`);
//     }
//     throw new Error("An unknown error occurred while changing the meal.");
//   }
// }
