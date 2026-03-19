"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
import { dietOutputSchema } from "../../lib/validations/diet";
import { computeTDEEOutput } from "../../lib/tdee";

const LOCALE_TO_LANGUAGE: Record<string, string> = {
  pl: "Polish",
  en: "English",
  de: "German",
  fr: "French",
  es: "Spanish",
  it: "Italian",
  cs: "Czech",
  sk: "Slovak",
  uk: "Ukrainian",
};

function buildSystemPrompt(input: {
  prefs: {
    allergies: string[];
    strictDiets: string[];
    preferredTypes: string[];
    avoidedTypes: string[];
    mealsPerDay: number;
    snacksPerDay: number;
    maxCookingTimeMins: number;
    favouriteMealNames: string[];
    likedIngredients: string[];
    dislikedIngredients: string[];
  };
  tdeeOutput: ReturnType<typeof computeTDEEOutput>;
  languageName: string;
}): string {
  const { prefs, tdeeOutput, languageName } = input;
  const targets = {
    tdeeKcal: tdeeOutput.tdeeKcal,
    dailyKcalTarget: tdeeOutput.dailyKcalTarget,
    proteinGrams: tdeeOutput.macroTargets.proteinGrams,
    carbGrams: tdeeOutput.macroTargets.carbGrams,
    fatGrams: tdeeOutput.macroTargets.fatGrams,
  };

  const allergyBlock =
    prefs.allergies.length > 0
      ? `CRITICAL: The user has these allergies - you MUST NEVER include any of these ingredients or allergens: ${prefs.allergies.join(", ")}.`
      : "";

  const dietsBlock =
    prefs.strictDiets.length > 0
      ? `CRITICAL: The user follows these dietary protocols: ${prefs.strictDiets.join(", ")}. All meals must comply.`
      : "";

  const prefsBlock =
    prefs.preferredTypes.length > 0
      ? `Preferred dish types: ${prefs.preferredTypes.join(", ")}.`
      : "";
  const avoidedBlock =
    prefs.avoidedTypes.length > 0
      ? `Avoid these dish types: ${prefs.avoidedTypes.join(", ")}.`
      : "";
  const likedBlock =
    prefs.likedIngredients.length > 0
      ? `Ingredients to prefer when possible: ${prefs.likedIngredients.join(", ")}.`
      : "";
  const dislikedBlock =
    prefs.dislikedIngredients.length > 0
      ? `Ingredients to AVOID: ${prefs.dislikedIngredients.join(", ")}.`
      : "";
  const favouritesBlock =
    prefs.favouriteMealNames.length > 0
      ? `The user enjoys these meals: ${prefs.favouriteMealNames.join(", ")}. Create recipes in a similar style when appropriate.`
      : "";

  return `You are an Expert Clinical Nutrition Agent. Your task is to generate a highly personalized, well-structured, and realistic daily diet plan based on the user's profile, goals, and constraints.

Write the ENTIRE response in ${languageName} only. All meal names, ingredients, instructions, and notes must be in ${languageName}.

You must strictly adhere to the following evidence-based nutritional frameworks:

1. MACRO & PLATE STRUCTURE (Harvard & USDA):
- Structure main meals using the "Harvard Healthy Eating Plate" ratios: 1/2 of the plate vegetables and fruits, 1/4 whole grains, 1/4 healthy proteins.
- Ensure all macronutrient and caloric estimates align with standard USDA FoodData Central nutritional profiles.

2. HEALTH GUARDRAILS (WHO):
- Keep added sugars to a minimum (under 5-10% of total daily energy intake).
- Keep sodium levels within healthy limits (<2,000 mg/day unless highly active).
- Prioritize unsaturated fats over saturated fats, strictly avoid trans fats.

3. PORTION SIZING (Precision Nutrition):
- For each ingredient provide quantityGrams (exact grams) and visualPortion (e.g. "1 palm-sized portion of chicken breast", "1 fist-sized portion of broccoli").

4. MICRONUTRIENT DENSITY:
- Ensure the diet is rich in micronutrients (fiber, vitamins, minerals). Emphasize nutrient-dense whole foods over processed diet foods.

5. SUPPLEMENTATION:
- Only recommend supplements if a diet is deficient due to restrictions (e.g. B12 for vegans, Vitamin D for indoor workers). Keep supplement advice minimal.

${allergyBlock}
${dietsBlock}
${prefsBlock}
${avoidedBlock}
${likedBlock}
${dislikedBlock}
${favouritesBlock}

INPUT DATA:
- Meals per day: ${prefs.mealsPerDay}
- Snacks per day: ${prefs.snacksPerDay}
- Max cooking time per meal: ${prefs.maxCookingTimeMins} minutes

TARGETS (you MUST use these exact values in the output):
- TDEE: ${targets.tdeeKcal} kcal
- Daily calorie target: ${targets.dailyKcalTarget} kcal
- Protein: ${targets.proteinGrams} g
- Carbs: ${targets.carbGrams} g
- Fat: ${targets.fatGrams} g

OUTPUT: Generate a daily meal plan with exactly ${prefs.mealsPerDay} main meals and ${prefs.snacksPerDay} snacks. Each meal must have:
- name (string)
- ingredients: array of { name, quantityGrams (number), visualPortion (string, e.g. "1 palm-sized portion") }
- prepInstructions (brief steps, fitting ${prefs.maxCookingTimeMins} min max)
- prepTimeMins (number, must be <= ${prefs.maxCookingTimeMins})

Also provide hydrationNote and micronutrientNote as brief strings.

Return a valid JSON object matching the diet output schema.`;
}

export const generateDiet = internalAction({
  args: {
    userId: v.id("users"),
    locale: v.optional(v.string()),
  },
  handler: async (ctx, { userId, locale }) => {
    await ctx.runMutation(internal.diet.mutations.recordDietResult, {
      userId,
      status: "running",
    });

    try {
      const prefs = await ctx.runQuery(internal.diet.queries.getDietInput, {
        userId,
      });

      const bio = prefs.biometrics;
      if (
        !bio?.age ||
        bio.heightCm == null ||
        bio.weightKg == null ||
        !bio.activityLevel
      ) {
        await ctx.runMutation(internal.diet.mutations.recordDietResult, {
          userId,
          status: "failed",
          error: "Complete your profile (age, height, weight, activity level) to generate a diet.",
        });
        return;
      }

      const tdeeOutput = computeTDEEOutput({
        age: bio.age,
        gender: bio.gender,
        heightCm: bio.heightCm,
        weightKg: bio.weightKg,
        activityLevel: bio.activityLevel,
        primaryGoal: bio.primaryGoal,
      });

      const languageName =
        locale && LOCALE_TO_LANGUAGE[locale.toLowerCase()]
          ? LOCALE_TO_LANGUAGE[locale.toLowerCase()]
          : "English";

      const systemPrompt = buildSystemPrompt({
        prefs,
        tdeeOutput,
        languageName,
      });

      const groqKey = process.env.GROQ_API_KEY;
      const model = groqKey
        ? groq("meta-llama/llama-4-scout-17b-16e-instruct")
        : google("gemini-2.0-flash");

      const { object } = await generateObject({
        model,
        schema: dietOutputSchema,
        system: systemPrompt,
        prompt: `Generate a complete daily diet plan for this user. Use the exact targets provided. Create ${prefs.mealsPerDay} main meals and ${prefs.snacksPerDay} snacks. Each meal must include ingredients with quantityGrams and visualPortion.`,
        ...(groqKey && {
          providerOptions: { groq: { strictJsonSchema: false } },
        }),
      });

      await ctx.runMutation(internal.diet.mutations.recordDietResult, {
        userId,
        status: "completed",
        result: object,
      });
    } catch (err) {
      await ctx.runMutation(internal.diet.mutations.recordDietResult, {
        userId,
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  },
});
