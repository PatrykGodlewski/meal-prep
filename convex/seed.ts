import type { Id } from "./_generated/dataModel";
import { mutation } from "./_generated/server";
import data from "./data.json"; // Assuming import.json is in the same directory
import { INGREDIENT_CATEGORIES, MEAL_CATEGORIES, UNITS } from "./schema";

// Define the structure of the input JSON data using Convex types
interface ImportData {
  meals: Array<{
    temp_id: string;
    name: string;
    description: string; // Description is required in Convex schema
    instructions?: string | null;
    prepTimeMinutes?: number | null;
    cookTimeMinutes?: number | null;
    servings?: number | null;
    category: (typeof MEAL_CATEGORIES)[number]; // Use Convex enum type
    imageUrl?: string | null;
    isPublic: boolean;
    // createdBy will be handled by the mutation context
  }>;
  ingredients: Array<{
    temp_id: string;
    name: string;
    category: (typeof INGREDIENT_CATEGORIES)[number]; // Use Convex enum type
    unit: (typeof UNITS)[number]; // Use Convex enum type
  }>;
  mealIngredients: Array<{
    mealId: string; // Corresponds to a meal's temp_id
    ingredientId: string; // Corresponds to an ingredient's temp_id
    quantity: number;
    isOptional: boolean;
    notes?: string | null;
  }>;
}

/**
 * Convex mutation to import meals, ingredients, and their relationships
 * from a JSON object into the database.
 * Handles mapping temporary IDs to database-generated IDs (_id).
 * Assigns the first found user as the creator for all meals.
 * NOTE: This mutation assumes `import.json` is bundled with the Convex deployment.
 * For large datasets or frequent runs, consider passing data as an argument.
 */
export const seedDatabase = mutation({
  handler: async (ctx) => {
    console.log("Starting Convex database seed...");

    // --- 0. Get User ID ---
    // For simplicity, assign all meals to the first user found.
    // In a real scenario, you might pass a specific userId or handle this differently.
    const user = await ctx.db.query("users").first();
    if (!user) {
      throw new Error(
        "Cannot seed database: No users found to assign ownership.",
      );
    }
    const userId = user._id;
    console.log(`Assigning meals to user: ${userId}`);

    // --- 1. Insert Ingredients and Map IDs ---
    const ingredientIdMap = new Map<string, Id<"ingredients">>(); // Map<temp_id, db_id>
    const importedData = data as ImportData; // Cast the imported JSON
    console.log(`Importing ${importedData.ingredients.length} ingredients...`);

    for (const ingredientData of importedData.ingredients) {
      try {
        // Validate category and unit against Convex enums
        if (!INGREDIENT_CATEGORIES.includes(ingredientData.category)) {
          throw new Error(
            `Invalid ingredient category: ${ingredientData.category}`,
          );
        }
        if (!UNITS.includes(ingredientData.unit)) {
          throw new Error(`Invalid ingredient unit: ${ingredientData.unit}`);
        }

        const ingredientId = await ctx.db.insert("ingredients", {
          name: ingredientData.name,
          category: ingredientData.category,
          unit: ingredientData.unit,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        ingredientIdMap.set(ingredientData.temp_id, ingredientId);
        // console.log(`Inserted ingredient: ${ingredientData.name} (Temp: ${ingredientData.temp_id}, DB: ${ingredientId})`);
      } catch (error) {
        console.error(
          `Error inserting ingredient "${ingredientData.name}":`,
          error,
        );
        throw new Error( // Re-throw to abort the mutation (transaction)
          `Failed during ingredient insertion for "${ingredientData.name}". Rolling back.`,
        );
      }
    }
    console.log("Finished importing ingredients.");

    // --- 2. Insert Meals and Map IDs ---
    const mealIdMap = new Map<string, Id<"meals">>(); // Map<temp_id, db_id>
    console.log(`Importing ${importedData.meals.length} meals...`);

    for (const mealData of importedData.meals) {
      try {
        // Validate category against Convex enums
        if (!MEAL_CATEGORIES.includes(mealData.category)) {
          throw new Error(`Invalid meal category: ${mealData.category}`);
        }

        const mealId = await ctx.db.insert("meals", {
          name: mealData.name,
          description: mealData.description, // Required field
          instructions: mealData.instructions ?? undefined, // Use undefined if null/missing
          prepTimeMinutes: mealData.prepTimeMinutes ?? undefined,
          cookTimeMinutes: mealData.cookTimeMinutes ?? undefined,
          servings: mealData.servings ?? undefined,
          category: mealData.category,
          imageUrl: mealData.imageUrl ?? undefined,
          isPublic: mealData.isPublic,
          createdBy: userId, // Assign the fetched user ID
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });

        mealIdMap.set(mealData.temp_id, mealId);
        // console.log(`Inserted meal: ${mealData.name} (Temp: ${mealData.temp_id}, DB: ${mealId})`);
      } catch (error) {
        console.error(`Error inserting meal "${mealData.name}":`, error);
        throw new Error( // Re-throw to abort the mutation
          `Failed during meal insertion for "${mealData.name}". Rolling back.`,
        );
      }
    }
    console.log("Finished importing meals.");

    // --- 3. Insert Meal-Ingredient Relationships ---
    console.log(
      `Importing ${importedData.mealIngredients.length} meal-ingredient relationships...`,
    );

    for (const linkData of importedData.mealIngredients) {
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

      try {
        await ctx.db.insert("mealIngredients", {
          mealId: dbMealId,
          ingredientId: dbIngredientId,
          quantity: linkData.quantity,
          isOptional: linkData.isOptional ?? false, // Default to false
          notes: linkData.notes ?? undefined,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      } catch (error) {
        console.error(
          `Error inserting relationship for meal temp_id ${linkData.mealId} and ingredient temp_id ${linkData.ingredientId}:`,
          error,
        );
        throw new Error( // Re-throw to abort the mutation
          "Failed during meal-ingredient relationship insertion. Rolling back.",
        );
      }
    }

    console.log("Finished importing meal-ingredient relationships.");
    console.log("Convex database seed finished successfully.");
    return `Successfully seeded ${importedData.meals.length} meals, ${importedData.ingredients.length} ingredients, and ${importedData.mealIngredients.length} relationships.`;
  },
});
