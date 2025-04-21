// "use server";
//
// import type { MealUpdateFormValues } from "@/features/meal-editor/meal-editor-form";
// import {
//   MealAddFormSchema,
//   type MealAddFormValues,
// } from "@/features/meal-editor/validators";
// import { authorize, getUser } from "@/lib/authorization";
// import { db } from "@/supabase";
// import {
//   meals,
//   plannedMeals,
//   ingredients,
//   mealIngredients,
//   type Ingredient,
// } from "@/supabase/schema";
// import { createClient } from "@/utils/supabase/server";
// import { encodedRedirect } from "@/utils/utils";
// import { and, count, eq, ilike, inArray } from "drizzle-orm";
// import { revalidatePath } from "next/cache";
// import { headers } from "next/headers";
// import { redirect } from "next/navigation";
// import { z } from "zod";
//
// export const signUpAction = async (formData: FormData) => {
//   const email = formData.get("email")?.toString();
//   const password = formData.get("password")?.toString();
//   const displayName = formData.get("nickname")?.toString() ?? "MealPrep User";
//   const supabase = await createClient();
//   const origin = (await headers()).get("origin");
//
//   if (!email || !password) {
//     return encodedRedirect(
//       "error",
//       "/sign-up",
//       "Email and password are required",
//     );
//   }
//
//   const { error } = await supabase.auth.signUp({
//     email,
//     password,
//     options: {
//       data: {
//         displayName,
//       },
//       emailRedirectTo: `${origin}/auth/callback`,
//     },
//   });
//
//   if (error) {
//     console.error(`${error.code} ${error.message}`);
//     return encodedRedirect("error", "/sign-up", error.message);
//   }
//
//   return encodedRedirect(
//     "success",
//     "/sign-up",
//     "Thanks for signing up! Please check your email for a verification link.",
//   );
// };
//
// export const signInAction = async (formData: FormData) => {
//   const email = formData.get("email") as string;
//   const password = formData.get("password") as string;
//   const supabase = await createClient();
//
//   const { error } = await supabase.auth.signInWithPassword({
//     email,
//     password,
//   });
//
//   if (error) {
//     return encodedRedirect("error", "/sign-in", error.message);
//   }
//
//   return redirect("/");
// };
//
// export const forgotPasswordAction = async (formData: FormData) => {
//   const email = formData.get("email")?.toString();
//   const supabase = await createClient();
//   const origin = (await headers()).get("origin");
//   const callbackUrl = formData.get("callbackUrl")?.toString();
//
//   if (!email) {
//     return encodedRedirect("error", "/forgot-password", "Email is required");
//   }
//
//   const { error } = await supabase.auth.resetPasswordForEmail(email, {
//     redirectTo: `${origin}/auth/callback?redirect_to=/reset-password`,
//   });
//
//   if (error) {
//     console.error(error.message);
//     return encodedRedirect(
//       "error",
//       "/forgot-password",
//       "Could not reset password",
//     );
//   }
//
//   if (callbackUrl) {
//     return redirect(callbackUrl);
//   }
//
//   return encodedRedirect(
//     "success",
//     "/forgot-password",
//     "Check your email for a link to reset your password.",
//   );
// };
//
// export const resetPasswordAction = async (formData: FormData) => {
//   const supabase = await createClient();
//
//   const password = formData.get("password") as string;
//   const confirmPassword = formData.get("confirmPassword") as string;
//
//   if (!password || !confirmPassword) {
//     encodedRedirect(
//       "error",
//       "/reset-password",
//       "Password and confirm password are required",
//     );
//   }
//
//   if (password !== confirmPassword) {
//     encodedRedirect("error", "/reset-password", "Passwords do not match");
//   }
//
//   const { error } = await supabase.auth.updateUser({
//     password: password,
//   });
//
//   if (error) {
//     encodedRedirect("error", "/reset-password", "Password update failed");
//   }
//
//   encodedRedirect("success", "/reset-password", "Password updated");
// };
//
// export const signOutAction = async () => {
//   const supabase = await createClient();
//   await supabase.auth.signOut();
//   return redirect("/sign-in");
// };
//
// export const addDisplayNameAction = async () => {
//   const supabase = await createClient();
//   const {
//     data: { user },
//   } = await supabase.auth.getUser();
//
//   if (!user) {
//     return redirect("/sign-in");
//   }
//
//   const formData = new FormData();
//   formData.append("displayName", user.user_metadata.full_name);
//   const { error } = await supabase.auth.updateUser({
//     data: {
//       displayName: formData.get("displayName")?.toString(),
//     },
//   });
//   if (error) {
//     console.error(error.message);
//     return encodedRedirect("error", "/profile", error.message);
//   }
//   return redirect("/");
// };
//
// interface Result {
//   success: boolean;
//   mealId?: string;
//   error?: string;
// }
//
// export async function addMealAction(data: MealAddFormValues): Promise<Result> {
//   try {
//     // 1. Authorize User
//     const user = await getUser();
//     const userId = user?.id;
//     if (!userId) {
//       return { success: false, error: "Unauthorized: User not authenticated." };
//     }
//
//     // 2. Server-Side Validation (Optional, if you trust client-side + Zod already)
//     // This would catch any manipulated data
//     const validatedData = MealAddFormSchema.parse(data);
//
//     // 3. Destructure Meal and Ingredient Data
//     const { ingredients: ingredientsData, ...mealBaseData } = validatedData; // Use validatedData, not 'data'
//
//     // 4. Begin Database Transaction
//     return await db.transaction(async (tx) => {
//       // 5. Insert Meal Record
//       const [newMeal] = await tx
//         .insert(meals)
//         .values({
//           ...mealBaseData, // Spread safe data
//           createdBy: userId,
//         })
//         .returning({ id: meals.id }); // Return only the ID
//       const mealId = newMeal.id;
//
//       // 6. Process Ingredients, Handle Duplicates & Inserts into mealIngredients
//
//       for (const ingredientData of ingredientsData) {
//         // 6a. Check if ingredient exists
//         const [existingIngredient] = await tx
//           .select({ id: ingredients.id })
//           .from(ingredients)
//           .where(eq(ingredients.name, ingredientData.name))
//           .limit(1);
//
//         let ingredientId: string; // Declare to get used later
//
//         if (existingIngredient) {
//           // The ingredient already exists
//           ingredientId = existingIngredient.id;
//         } else {
//           // 6b. INSERT the new ingredient since it does not exists
//           const [newIngredient] = await tx
//             .insert(ingredients)
//             .values({
//               name: ingredientData.name,
//               category: ingredientData.category, // Added data from form
//               unit: ingredientData.unit, // Added data from form
//             })
//             .returning({ id: ingredients.id });
//
//           ingredientId = newIngredient.id;
//         }
//
//         // 7. INSERT record in junction table (mealIngredients)
//         await tx.insert(mealIngredients).values({
//           mealId: mealId, // Link to the meal
//           ingredientId: ingredientId, // Link to ingredient
//           quantity: ingredientData.quantity, // Save the specific quantity
//           isOptional: ingredientData.isOptional, // Store the optional state
//           notes: ingredientData.notes || null, // Save the note field
//         });
//       }
//
//       // 8. Revalidate Routes
//       revalidatePath(`/meals/${mealId}`); // For the individual meal page
//       revalidatePath("/meals"); // For the meal list page (or dashboard)
//
//       // 9. All good
//       return { success: true, mealId: mealId };
//     });
//   } catch (error) {
//     console.error("Error adding meal:", error);
//     const message =
//       error instanceof z.ZodError
//         ? error.message
//         : "Database error during meal creation.";
//
//     return {
//       success: false,
//       error: message,
//     };
//   }
// }
//
// interface DeleteResult {
//   success: boolean;
//   error?: string;
// }
//
// // Define a clear result type
// interface UpdateResult {
//   success: boolean;
//   error?: string;
//   mealId?: string;
// }
//
// /**
//  * Updates a Meal record and synchronizes its associated Ingredients
//  * via the mealIngredients junction table.
//  * Handles finding/creating ingredient definitions, updating/inserting/deleting
//  * the links between the meal and ingredients.
//  * Operates within a database transaction.
//  * @param data - Validated form data conforming to MealUpdateFormValues.
//  * @returns Promise<UpdateResult> indicating success or failure.
//  */
// export async function updateMeal(
//   data: MealUpdateFormValues,
// ): Promise<UpdateResult> {
//   // 1. Input Validation (Basic check)
//   if (!data?.id) {
//     return { success: false, error: "Invalid meal data: Missing ID." };
//   }
//   if (!data.ingredients || !Array.isArray(data.ingredients)) {
//     return {
//       success: false,
//       error: "Invalid meal data: Missing ingredients array.",
//     };
//   }
//
//   const {
//     ingredients: submittedIngredients,
//     id: mealId,
//     ...mealBaseData
//   } = data;
//
//   try {
//     return await db.transaction(async (tx) => {
//       // 2. Update Meal Details
//       await tx
//         .update(meals)
//         .set({
//           name: mealBaseData.name,
//           description: mealBaseData.description,
//           instructions: mealBaseData.instructions,
//           prepTimeMinutes: mealBaseData.prepTimeMinutes,
//           cookTimeMinutes: mealBaseData.cookTimeMinutes,
//           servings: mealBaseData.servings,
//           category: mealBaseData.category,
//           imageUrl: mealBaseData.imageUrl,
//           isPublic: mealBaseData.isPublic,
//           updatedAt: new Date(),
//         })
//         .where(eq(meals.id, mealId));
//
//       // 3. Fetch Existing Meal-Ingredient Links for this Meal
//       const existingLinks = await tx
//         .select({
//           ingredientId: mealIngredients.ingredientId,
//           // Include other fields from mealIngredients if needed for comparison,
//           // but usually ingredientId is enough to identify the link.
//         })
//         .from(mealIngredients)
//         .where(eq(mealIngredients.mealId, mealId));
//
//       const existingIngredientIdsInMeal = new Set(
//         existingLinks.map((link) => link.ingredientId),
//       );
//       const submittedIngredientIds = new Set<string>(); // Track ingredient IDs present in the submission
//
//       // --- Promises for concurrent execution ---
//       // biome-ignore lint/suspicious/noExplicitAny: <explanation>
//       const upsertPromises: Promise<any>[] = []; // Combine inserts and updates for links
//
//       // 4. Process Submitted Ingredients: Find/Create Ingredient, Upsert Link
//       for (const submittedIng of submittedIngredients) {
//         let ingredientId: string;
//
//         // 4a. Find or Create the Ingredient Definition
//         const [existingIngredient] = await tx
//           .select({ id: ingredients.id })
//           .from(ingredients)
//           .where(eq(ingredients.name, submittedIng.name)) // Match by unique name
//           .limit(1);
//
//         if (existingIngredient) {
//           ingredientId = existingIngredient.id;
//           // Update the existing ingredient's category and unit if provided
//           // Add this update operation to the list of promises to run within the transaction
//           upsertPromises.push(
//             tx
//               .update(ingredients)
//               .set({
//                 category: submittedIng.category || null, // Use submitted category or null
//                 unit: submittedIng.unit || null, // Use submitted unit or null
//               })
//               .where(eq(ingredients.id, ingredientId)),
//           );
//         } else {
//           // Insert new ingredient definition
//           const [newIngredient] = await tx
//             .insert(ingredients)
//             .values({
//               name: submittedIng.name,
//               category: submittedIng.category || null,
//               unit: submittedIng.unit || null,
//               // Let DB handle default 'id' and 'createdAt'
//             })
//             .returning({ id: ingredients.id });
//
//           if (!newIngredient?.id) {
//             throw new Error(
//               `Failed to insert new ingredient: ${submittedIng.name}`,
//             );
//           }
//           ingredientId = newIngredient.id;
//         }
//
//         submittedIngredientIds.add(ingredientId); // Mark this ingredient as present in submission
//
//         // 4b. Prepare data for the mealIngredients junction table link
//         const mealIngredientPayload = {
//           mealId: mealId,
//           ingredientId: ingredientId,
//           quantity: submittedIng.quantity, // Required
//           isOptional: submittedIng.isOptional ?? false,
//           notes: submittedIng.notes || null,
//         };
//
//         // 4c. Upsert the Link in mealIngredients
//         // Drizzle's .onConflictDoUpdate is ideal here if your DB supports it (like PostgreSQL)
//         // It attempts an INSERT, and if a conflict occurs on the primary key (mealId, ingredientId),
//         // it performs an UPDATE instead.
//         upsertPromises.push(
//           tx
//             .insert(mealIngredients)
//             .values(mealIngredientPayload)
//             .onConflictDoUpdate({
//               target: [mealIngredients.mealId, mealIngredients.ingredientId], // Target the composite PK
//               set: {
//                 // Fields to update on conflict
//                 quantity: mealIngredientPayload.quantity,
//                 isOptional: mealIngredientPayload.isOptional,
//                 notes: mealIngredientPayload.notes,
//               },
//             }),
//         );
//       }
//
//       // 5. Determine and Prepare Deletes for mealIngredients links
//       const ingredientIdsToDelete = Array.from(
//         existingIngredientIdsInMeal,
//       ).filter((id) => !submittedIngredientIds.has(id));
//
//       // biome-ignore lint/suspicious/noExplicitAny: <explanation>
//       let deletePromise: Promise<any> | null = null;
//       if (ingredientIdsToDelete.length > 0) {
//         // Delete links from mealIngredients that were not submitted
//         deletePromise = tx
//           .delete(mealIngredients)
//           .where(
//             and(
//               eq(mealIngredients.mealId, mealId),
//               inArray(mealIngredients.ingredientId, ingredientIdsToDelete),
//             ),
//           );
//       }
//
//       // 6. Execute DB Operations Concurrently
//       const allPromises = [...upsertPromises];
//       if (deletePromise) {
//         allPromises.push(deletePromise);
//       }
//       await Promise.all(allPromises);
//
//       // 7. Revalidate Paths
//       revalidatePath(`/meals/${mealId}`);
//       revalidatePath("/meals");
//
//       return { success: true, mealId: mealId }; // Return success from transaction block
//     }); // Transaction commits here if no errors were thrown
//   } catch (error) {
//     console.error("Error updating meal:", { mealId, data, error });
//     let message =
//       error instanceof Error
//         ? error.message
//         : "Database error occurred during update.";
//     if (error instanceof z.ZodError) {
//       // Check specifically for Zod errors if server-side validation added
//       message = `Invalid data format: ${error.flatten().fieldErrors}`;
//     }
//     return { success: false, error: message };
//   }
// }
//
// // Define a clear result type
// interface DeleteResult {
//   success: boolean;
//   error?: string;
// }
//
// /**
//  * Deletes a Meal record and its associations in junction tables (plannedMeals, mealsTags).
//  * Ingredients associated with the meal will have their mealId set to NULL
//  * due to the 'on delete set null' constraint (requires schema modification and migration).
//  * @param id - The UUID string of the meal to delete.
//  * @returns Promise<DeleteResult> indicating success or failure.
//  */
// export async function deleteMeal(id: string): Promise<DeleteResult> {
//   if (!id) {
//     return { success: false, error: "Meal ID is required." };
//   }
//
//   try {
//     await db.transaction(async (tx) => {
//       // 1. Delete associations in plannedMeals table first
//       //    (Important if plannedMeals has FK to meals with RESTRICT/NO ACTION)
//       await tx.delete(plannedMeals).where(eq(plannedMeals.mealId, id));
//
//       // 2. Delete associations in mealsTags table
//
//       // 3. Delete the meal itself
//       //    The 'on delete set null' constraint on ingredients.mealId
//       //    will automatically handle setting related ingredients' mealId to NULL.
//       const deleteResult = await tx
//         .delete(meals)
//         .where(eq(meals.id, id))
//         .returning({ deletedId: meals.id }); // Optional: check if something was deleted
//
//       if (deleteResult.length === 0) {
//         // Optional: Throw error if meal wasn't found to trigger rollback
//         throw new Error(`Meal with ID ${id} not found for deletion.`);
//       }
//
//       // 4. Revalidate relevant paths after successful deletion
//       revalidatePath("/meals"); // Revalidate the list page
//       // No need to revalidate `/meals/${id}` as it won't exist anymore
//     }); // Transaction commits here if no errors were thrown
//
//     return { success: true };
//   } catch (error) {
//     console.error("Error deleting meal:", error);
//     const message =
//       error instanceof Error
//         ? error.message
//         : "Database error occurred during deletion.";
//     return { success: false, error: message };
//   }
// }
//
// export const getAllIngredients = async (): Promise<Ingredient[]> => {
//   try {
//     console.log("Fetching all ingredients..."); // Optional: Add logging
//
//     const ingredientList = await db.query.ingredients.findMany({
//       // Correct orderBy syntax: provide an array of columns
//       orderBy: (ingredientsTable, { asc }) => [
//         asc(ingredientsTable.category), // Order by category first (ascending, nulls might come first or last depending on DB)
//         asc(ingredientsTable.name), // Then order by name (ascending)
//       ],
//       // Optionally select specific columns if you don't need the entire object:
//       // columns: {
//       //   id: true,
//       //   name: true,
//       //   category: true,
//       //   unit: true,
//       // }
//     });
//
//     console.log(`Successfully fetched ${ingredientList.length} ingredients.`); // Optional logging
//     return ingredientList;
//   } catch (error) {
//     console.error("Error fetching ingredient list:", error);
//     // Re-throw a more specific error or the original one
//     // This allows Server Components using this function to catch it and potentially show an error state or trigger notFound()
//     throw new Error("Failed to fetch ingredients from database.");
//   }
// };
//
// export async function getMeals() {
//   try {
//     const user = await getUser();
//
//     if (!user?.id) return [];
//
//     return await db
//
//       .select()
//       .from(meals)
//       // TODO: data need to be transformed
//       // .where(eq(meals.isPublic, true))
//       .orderBy(meals.createdAt);
//   } catch (error) {
//     console.error("Error fetching meals:", error);
//     return [];
//   }
// }
//
// const MEALS_PER_PAGE = 10; // Define how many meals per page
//
// export async function getMealsWithQuery(searchQuery?: string, page = 1) {
//   try {
//     const user = await getUser();
//     if (!user) {
//       return { meals: [], totalCount: 0 };
//     }
//
//     const offset = (page - 1) * MEALS_PER_PAGE;
//
//     // --- Build Conditions Dynamically ---
//     // const conditions: any[] = [eq(meals.createdBy, user.id)]; // Start with mandatory user filter
//     // biome-ignore lint/suspicious/noExplicitAny: <explanation>
//     const conditions: any[] = []; // Start with mandatory user filter
//
//     if (searchQuery) {
//       conditions.push(ilike(meals.name, `%${searchQuery}%`)); // Add search filter if provided
//     }
//     // --- End Build Conditions ---
//
//     // Query for the paginated meals
//     const paginatedMealsQuery = db
//       .select()
//       .from(meals)
//       .where(and(...conditions)) // Apply all conditions using and()
//       .orderBy(meals.createdAt) // Or any other desired order
//       .limit(MEALS_PER_PAGE)
//       .offset(offset);
//
//     // Query to get the total count of matching meals (without pagination)
//     // Apply the same dynamic conditions
//     const countQuery = db
//       .select({ count: count() }) // Select the count
//       .from(meals)
//       .where(and(...conditions)); // Apply the same conditions here
//
//     // Execute both queries
//     const [paginatedMeals, totalResult] = await Promise.all([
//       paginatedMealsQuery,
//       countQuery,
//     ]);
//
//     const totalCount = totalResult[0]?.count ?? 0;
//
//     return { meals: paginatedMeals, totalCount };
//   } catch (error) {
//     console.error("Error fetching meals:", error);
//     // Return an empty structure in case of error
//     return { meals: [], totalCount: 0 };
//   }
// }
