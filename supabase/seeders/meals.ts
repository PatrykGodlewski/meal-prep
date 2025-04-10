import { db } from "..";
import { mealCategoryEnum, meals } from "../schema";
import { faker } from "@faker-js/faker"; // For generating fake data

async function seedMeals(count: number): Promise<void> {
  try {
    console.log("start");
    // Array to hold our meal data
    const mealData = [];

    for (let i = 0; i < count; i++) {
      // Create each meal
      const category =
        mealCategoryEnum.enumValues[
          Math.floor(Math.random() * mealCategoryEnum.enumValues.length)
        ]; // Random category
      mealData.push({
        name: faker.commerce.productName(),
        description: faker.lorem.paragraph(),
        instructions: faker.lorem.paragraphs(2),
        prepTimeMinutes: faker.number.int({ min: 5, max: 60 }),
        cookTimeMinutes: faker.number.int({ min: 10, max: 90 }),
        servings: faker.number.int({ min: 1, max: 6 }),
        category: category,
        imageUrl: "",
        isPublic: faker.datatype.boolean(),
        createdBy: "47ad5682-4626-425f-a6d6-28202f0fb58b", // Replace with an actual user ID if you have one, it should be uuid
      });
    }

    await db.insert(meals).values(mealData);

    console.log(`Successfully seeded ${count} meals.`);
  } catch (error) {
    console.error("Error seeding meals:", error);
    throw error; // Re-throw to prevent the script from continuing
  }
}

export async function seedDatabase() {
  try {
    // You can call multiple seed functions here, if you have more
    await seedMeals(50); // Seed 50 meals
    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
  return 0;
}

// Run the seeder (you'll need to adapt this to your environment)
seedDatabase();
