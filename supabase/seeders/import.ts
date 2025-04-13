import { db } from "@/supabase"; // Adjust path if necessary
import data from "./import.json";
import {
  meals,
  ingredients,
  mealIngredients,
  type MEAL_CATEGORY_ENUM,
  type INGREDIENT_CATEGORY_ENUM,
  type UNIT_ENUM,
} from "@/supabase/schema"; // Adjust path if necessary

// Define the structure of the input JSON data
interface ImportData {
  meals: Array<{
    temp_id: string;
    name: string;
    description: string | null;
    instructions: string | null;
    prepTimeMinutes: number | null;
    cookTimeMinutes: number | null;
    servings: number | null;
    category: (typeof MEAL_CATEGORY_ENUM.enumValues)[number] | null;
    imageUrl: string | null;
    isPublic: boolean;
    createdBy?: string | null; // Optional: Assuming UUID string or null
  }>;
  ingredients: Array<{
    temp_id: string;
    name: string;
    category: (typeof INGREDIENT_CATEGORY_ENUM.enumValues)[number] | null;
    unit: (typeof UNIT_ENUM.enumValues)[number] | null;
  }>;
  mealIngredients: Array<{
    mealId: string; // Corresponds to a meal's temp_id
    ingredientId: string; // Corresponds to an ingredient's temp_id
    quantity: number;
    isOptional: boolean;
    notes: string | null;
  }>;
}

// Type for the Drizzle DB instance based on your setup

/**
 * Imports meals, ingredients, and their relationships from a JSON object
 * into the database using Drizzle ORM.
 * Handles mapping temporary IDs to database-generated UUIDs within a transaction.
 *
 * @param dbInstance - The Drizzle ORM database instance.
 * @param data - The JSON data object containing meals, ingredients, and links.
 */
export async function importMealsAndIngredients(
  data: ImportData,
): Promise<void> {
  console.log("Starting meal and ingredient import...");

  // Use a transaction to ensure all operations succeed or fail together
  await db.transaction(async (tx) => {
    console.log("Transaction started.");

    // --- 1. Insert Ingredients and Map IDs ---
    const ingredientIdMap = new Map<string, string>(); // Map<temp_id, db_uuid>
    console.log(`Importing ${data.ingredients.length} ingredients...`);

    for (const ingredientData of data.ingredients) {
      try {
        const [insertedIngredient] = await tx
          .insert(ingredients)
          .values({
            name: ingredientData.name,
            category: ingredientData.category,
            unit: ingredientData.unit,
            // createdAt will be set by the database default
          })
          .returning({ id: ingredients.id });

        if (!insertedIngredient || !insertedIngredient.id) {
          throw new Error(
            `Failed to insert ingredient "${ingredientData.name}" or retrieve its ID.`,
          );
        }

        ingredientIdMap.set(ingredientData.temp_id, insertedIngredient.id);
        // console.log(`Inserted ingredient: ${ingredientData.name} (Temp: ${ingredientData.temp_id}, DB: ${insertedIngredient.id})`);
      } catch (error) {
        console.error(
          `Error inserting ingredient "${ingredientData.name}":`,
          error,
        );
        // Throwing the error will cause the transaction to rollback
        throw new Error(
          `Failed during ingredient insertion for "${ingredientData.name}". Rolling back.`,
        );
      }
    }
    console.log("Finished importing ingredients.");

    // --- 2. Insert Meals and Map IDs ---
    const mealIdMap = new Map<string, string>(); // Map<temp_id, db_uuid>
    console.log(`Importing ${data.meals.length} meals...`);

    for (const mealData of data.meals) {
      try {
        const [insertedMeal] = await tx
          .insert(meals)
          .values({
            name: mealData.name,
            description: mealData.description ?? "",
            instructions: mealData.instructions,
            prepTimeMinutes: mealData.prepTimeMinutes,
            cookTimeMinutes: mealData.cookTimeMinutes,
            servings: mealData.servings,
            category: mealData.category,
            imageUrl: mealData.imageUrl,
            isPublic: mealData.isPublic,
            createdBy: mealData.createdBy, // Ensure this is a valid UUID string or null
            // createdAt and updatedAt will be set by the database default
          })
          .returning({ id: meals.id });

        if (!insertedMeal || !insertedMeal.id) {
          throw new Error(
            `Failed to insert meal "${mealData.name}" or retrieve its ID.`,
          );
        }

        mealIdMap.set(mealData.temp_id, insertedMeal.id);
        // console.log(`Inserted meal: ${mealData.name} (Temp: ${mealData.temp_id}, DB: ${insertedMeal.id})`);
      } catch (error) {
        console.error(`Error inserting meal "${mealData.name}":`, error);
        throw new Error(
          `Failed during meal insertion for "${mealData.name}". Rolling back.`,
        );
      }
    }
    console.log("Finished importing meals.");

    // --- 3. Insert Meal-Ingredient Relationships ---
    console.log(
      `Importing ${data.mealIngredients.length} meal-ingredient relationships...`,
    );
    const mealIngredientValues: Array<{
      mealId: string;
      ingredientId: string;
      quantity: number;
      isOptional: boolean;
      notes: string | null;
    }> = [];

    for (const linkData of data.mealIngredients) {
      const dbMealId = mealIdMap.get(linkData.mealId);
      const dbIngredientId = ingredientIdMap.get(linkData.ingredientId);

      if (!dbMealId) {
        throw new Error(
          `Could not find database ID for meal with temp_id "${linkData.mealId}". Rolling back.`,
        );
      }
      if (!dbIngredientId) {
        throw new Error(
          `Could not find database ID for ingredient with temp_id "${linkData.ingredientId}". Rolling back.`,
        );
      }

      mealIngredientValues.push({
        mealId: dbMealId,
        ingredientId: dbIngredientId,
        quantity: linkData.quantity,
        isOptional: linkData.isOptional ?? false, // Default to false if null/undefined
        notes: linkData.notes,
      });
    }

    // Perform bulk insert for relationships if there are any
    if (mealIngredientValues.length > 0) {
      try {
        await tx.insert(mealIngredients).values(mealIngredientValues);
        console.log("Finished importing meal-ingredient relationships.");
      } catch (error) {
        console.error("Error inserting meal-ingredient relationships:", error);
        throw new Error(
          "Failed during meal-ingredient relationship insertion. Rolling back.",
        );
      }
    } else {
      console.log("No meal-ingredient relationships to import.");
    }

    console.log("Transaction committed successfully.");
  }); // End of transaction

  console.log("Meal and ingredient import finished successfully.");
}

// --- Example Usage (replace with your actual data loading) ---
function runImport() {
  // 1. Load your JSON data (e.g., from a file)
  // const jsonData: ImportData = require('./your-data.json'); // Or use fs.readFile

  // Assuming 'db' is your configured Drizzle instance from '@/supabase'
  console.log("Import STARTED.");
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  importMealsAndIngredients(data as any)
    .then(() => {
      console.log("Import completed.");
    })
    .catch((error) => {
      console.error("Import failed:", error);
    })
    .finally(() => {
      console.log("Exiting script.");
      process.exit(0);
    });
}

runImport();
