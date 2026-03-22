"use node";

import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
import { generateObject } from "ai";
import { v } from "convex/values";
import { ragMealOutputSchema } from "../../lib/validations/meal";
import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";
import { generateEmbedding } from "./embeddings";

const TOP_K = 5;

const MEAL_IMAGE_PROMPT = (title: string, description?: string | null) =>
  description
    ? `Appetizing, professional food photography of: ${title}. ${description}. High quality, well-lit, on a plate or bowl.`
    : `Appetizing, professional food photography of: ${title}. High quality, well-lit, on a plate or bowl.`;

/** Pollinations.ai – free image generation, no API key. Returns image bytes for storage. */
async function generateMealImagePollinations(
  title: string,
  description?: string | null,
): Promise<{ url: string; base64: string; contentType: string } | null> {
  const prompt = MEAL_IMAGE_PROMPT(title, description);
  const url = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?width=1024&height=1024`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const base64 = Buffer.from(buf).toString("base64");
    const contentType = res.headers.get("content-type") ?? "image/png";
    return { url, base64, contentType };
  } catch (e) {
    console.warn("Pollinations image generation failed:", e);
    return null;
  }
}

/** Replicate FLUX Schnell – food photo. Returns image URL and optional base64. Use Pollinations if 402 (no credit). */
async function generateMealImageReplicate(
  title: string,
  description?: string | null,
): Promise<{ url: string; base64: string; contentType: string } | null> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) return null;

  const prompt = MEAL_IMAGE_PROMPT(title, description);

  const res = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "wait=60",
    },
    body: JSON.stringify({
      version:
        "5d891b49a17e1cdd6786d441e1e3a2f0f76daeeee0c59868bd598b4951d3c58a",
      input: {
        prompt,
        output_format: "webp",
        output_quality: 80,
        aspect_ratio: "1:1",
      },
    }),
  });

  if (res.status === 402) {
    return null;
  }
  if (!res.ok) {
    const err = await res.text();
    console.warn("Replicate image generation failed:", res.status, err);
    return null;
  }

  const data = (await res.json()) as {
    output?: string | string[] | { url?: string }[];
    error?: string;
    status?: string;
  };

  if (data.error) {
    console.warn("Replicate error:", data.error);
    return null;
  }

  let imageUrl: string | null = null;
  const out = data.output;
  if (typeof out === "string" && out.startsWith("http")) {
    imageUrl = out;
  } else if (typeof out === "string" && out.startsWith("data:")) {
    imageUrl = out;
  } else if (Array.isArray(out) && out.length > 0) {
    const first = out[0];
    imageUrl = typeof first === "string" ? first : (first?.url ?? null);
  }
  if (!imageUrl) {
    console.warn(
      "Replicate returned no image URL:",
      JSON.stringify(data).slice(0, 300),
    );
    return null;
  }

  try {
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      console.warn("Failed to fetch Replicate image:", imgRes.status);
      return { url: imageUrl, base64: "", contentType: "image/webp" };
    }
    const buf = await imgRes.arrayBuffer();
    const base64 = Buffer.from(buf).toString("base64");
    const contentType = imgRes.headers.get("content-type") ?? "image/webp";
    return { url: imageUrl, base64, contentType };
  } catch (e) {
    console.warn("Failed to fetch image bytes:", e);
    return { url: imageUrl, base64: "", contentType: "image/webp" };
  }
}

/** Generate a food image: try Replicate first, then free Pollinations if no credit or no token. */
async function generateMealImage(
  title: string,
  description?: string | null,
): Promise<{ url: string; base64: string; contentType: string } | null> {
  const fromReplicate = await generateMealImageReplicate(title, description);
  if (fromReplicate) return fromReplicate;
  return generateMealImagePollinations(title, description);
}

/**
 * Internal action: RAG-driven meal generation.
 * Scheduled by requestMealGeneration mutation.
 */
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

export const generateMealWithContext = internalAction({
  args: {
    requestId: v.id("mealGenerationRequests"),
    userId: v.id("users"),
    prompt: v.string(),
    locale: v.optional(v.string()),
    planId: v.optional(v.id("plans")),
    date: v.optional(v.number()),
  },
  handler: async (ctx, { requestId, userId, prompt, locale }) => {
    await ctx.runMutation(internal.ai.mutations.recordMealGenerationResult, {
      requestId,
      status: "running",
    });

    try {
      const prefs = await ctx.runQuery(internal.ai.queries.getRAGInput, {
        userId,
      });

      const allergies = prefs.allergies;
      const likes = prefs.likes;
      const avoided = prefs.avoided;
      const favouriteMealNames = prefs.favouriteMealNames ?? [];

      const embedding = await generateEmbedding(prompt);

      const vectorResults = await ctx.vectorSearch("meals", "by_embedding", {
        vector: embedding,
        limit: TOP_K,
      });

      const mealDocs = await Promise.all(
        vectorResults.map((r) =>
          ctx.runQuery(internal.ai.queries.getMealForEmbedding, {
            mealId: r._id,
          }),
        ),
      );

      const referenceContext = mealDocs
        .filter((m): m is NonNullable<typeof m> => m !== null)
        .map((m) =>
          `- ${m.name}: ${m.searchContent || m.instructions || m.description || ""}`.trim(),
        )
        .join("\n");

      const allergyConstraint =
        allergies.length > 0
          ? `CRITICAL: The user has these allergies - you MUST NEVER include any of these ingredients or allergens: ${allergies.join(", ")}.`
          : "";

      const likesHint =
        likes.length > 0
          ? `The user prefers these dish types: ${likes.join(", ")}.`
          : "";

      const avoidedHint =
        avoided.length > 0
          ? `The user avoids these dish types: ${avoided.join(", ")}.`
          : "";

      const favouritesHint =
        favouriteMealNames.length > 0
          ? `The user often enjoys these meals: ${favouriteMealNames.join(", ")}. Prefer recipes that are similar in style or ingredients when appropriate.`
          : "";

      const languageName = locale
        ? (LOCALE_TO_LANGUAGE[locale.toLowerCase()] ?? locale)
        : null;
      const languageInstruction = languageName
        ? `CRITICAL: Write the ENTIRE recipe in ${languageName} only. Title, description, instructions, and ingredient names must all be in ${languageName}. Do not mix languages.`
        : `Write the recipe in the SAME language as the user's prompt (e.g. if the user writes in Polish, respond entirely in Polish: title, description, instructions, ingredient names). Do not mix languages.`;

      const systemPrompt = `You are a Master Nutritionist and expert chef. Generate a single, delicious meal that matches the user's request.

${languageInstruction}

${allergyConstraint}

${likesHint}

${avoidedHint}

${favouritesHint}

Use these existing recipes as inspiration and reference for style, proportions, and techniques:

${referenceContext || "(No similar recipes found - create an original meal.)"}

Respond with a valid meal object:
- title (string)
- description (optional short summary, 1-2 sentences)
- category (optional: one of breakfast, lunch, dinner, snack, dessert, drinks)
- prepTimeMinutes (optional: preparation time in minutes, e.g. chopping)
- cookTimeMinutes (optional: cooking/baking time in minutes)
- ingredients (array: each with name, quantity, unit)
- instructions (string)
- macros (optional: calories, protein, fat, carbs)`;

      // Prefer Groq (free tier); use model that supports json_schema. Fall back to Google if no Groq key.
      const groqKey = process.env.GROQ_API_KEY;
      const model = groqKey
        ? groq("meta-llama/llama-4-scout-17b-16e-instruct")
        : google("gemini-2.0-flash");

      const { object } = await generateObject({
        model,
        schema: ragMealOutputSchema,
        system: systemPrompt,
        prompt,
        ...(groqKey && {
          providerOptions: { groq: { strictJsonSchema: false } },
        }),
      });

      let imageUrl: string | undefined;
      const imageResult = await generateMealImage(
        object.title,
        object.description,
      );
      if (imageResult) {
        if (imageResult.base64) {
          try {
            const binary = Buffer.from(imageResult.base64, "base64");
            const blob = new Blob([binary], { type: imageResult.contentType });
            const storageId = await ctx.storage.store(blob);
            const url = await ctx.storage.getUrl(storageId);
            imageUrl = url ?? undefined;
          } catch (storeErr) {
            console.warn(
              "Failed to store meal image in Convex, using Replicate URL:",
              storeErr,
            );
            imageUrl = imageResult.url.startsWith("http")
              ? imageResult.url
              : undefined;
          }
        } else {
          imageUrl = imageResult.url.startsWith("http")
            ? imageResult.url
            : undefined;
        }
      }

      const mealId = await ctx.runMutation(
        internal.ai.mutations.persistGeneratedMeal,
        {
          userId,
          title: object.title,
          description: object.description,
          category: object.category,
          prepTimeMinutes: object.prepTimeMinutes,
          cookTimeMinutes: object.cookTimeMinutes,
          imageUrl,
          ingredients: object.ingredients,
          instructions: object.instructions,
          calories: object.macros?.calories,
        },
      );

      await ctx.runMutation(internal.ai.mutations.recordMealGenerationResult, {
        requestId,
        status: "completed",
        mealId,
        result: { mealId, meal: object },
      });
    } catch (err) {
      await ctx.runMutation(internal.ai.mutations.recordMealGenerationResult, {
        requestId,
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  },
});
