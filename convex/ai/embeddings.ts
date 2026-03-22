"use node";

import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";

const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 768;
const GOOGLE_EMBED_URL = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent`;

/**
 * Generate an embedding vector using Google gemini-embedding-001 (768 dims via outputDimensionality).
 * Free tier via Google AI Studio. Used by RAG action and embedding-on-insert pipeline.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing credentials. Set GOOGLE_GENERATIVE_AI_API_KEY in Convex Dashboard > Settings > Environment Variables (get a free key at https://aistudio.google.com/apikey)",
    );
  }

  const res = await fetch(
    `${GOOGLE_EMBED_URL}?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: {
          parts: [{ text }],
        },
        outputDimensionality: EMBEDDING_DIMENSIONS,
      }),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google embedding API error ${res.status}: ${err}`);
  }

  const data = (await res.json()) as { embedding?: { values?: number[] } };
  const values = data.embedding?.values;
  if (!values || values.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Unexpected embedding dimensions: expected ${EMBEDDING_DIMENSIONS}, got ${values?.length ?? 0}`,
    );
  }
  return values;
}

/**
 * Internal action: generate embedding for a meal and store it.
 * Scheduled by addMeal/editMeal to keep vector search up to date.
 */
export const generateAndStoreEmbedding = internalAction({
  args: {
    mealId: v.id("meals"),
  },
  handler: async (ctx, { mealId }) => {
    const meal = await ctx.runQuery(internal.ai.queries.getMealForEmbedding, {
      mealId,
    });
    if (!meal) return;
    const textToEmbed =
      meal.searchContent ||
      `${meal.name} ${meal.description ?? ""} ${meal.instructions ?? ""}`.trim();
    if (!textToEmbed) return;
    const embedding = await generateEmbedding(textToEmbed);
    await ctx.runMutation(internal.ai.mutations.patchMealEmbedding, {
      mealId,
      embedding,
    });
  },
});
