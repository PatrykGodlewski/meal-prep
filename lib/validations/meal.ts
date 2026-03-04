import { z } from "zod";

/** Units for RAG-generated ingredients. Must match convex/schema UNITS. */
export const RAG_UNITS = [
  "g",
  "kg",
  "ml",
  "l",
  "tsp",
  "tbsp",
  "cup",
  "oz",
  "lb",
  "piece",
  "pinch",
] as const;

/** Meal categories for RAG output. Must match convex/schema MEAL_CATEGORIES. */
export const RAG_MEAL_CATEGORIES = [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
  "dessert",
  "drinks",
] as const;

/** Coerce any value to one of allowed categories, or undefined. */
const categoryOptional = z
  .union([z.string(), z.number()])
  .optional()
  .transform((s) => {
    if (s === undefined || s === null) return undefined;
    const lower = String(s).toLowerCase().trim();
    return RAG_MEAL_CATEGORIES.includes(lower as (typeof RAG_MEAL_CATEGORIES)[number])
      ? (lower as (typeof RAG_MEAL_CATEGORIES)[number])
      : undefined;
  });

/** Coerce any value to one of allowed units; default to "g" if invalid. */
const unitWithFallback = z
  .union([z.string(), z.number()])
  .transform((s) => {
    const lower = String(s ?? "").toLowerCase().trim();
    return RAG_UNITS.includes(lower as (typeof RAG_UNITS)[number])
      ? (lower as (typeof RAG_UNITS)[number])
      : "g";
  });

/** Zod schema for AI-generated meal output (title, description, category, times, ingredients, instructions, macros). */
export const ragMealOutputSchema = z.object({
  title: z.union([z.string(), z.number()]).transform(String).pipe(z.string().min(1)),
  description: z.union([z.string(), z.number()]).optional().transform((s) => (s == null ? undefined : String(s))),
  category: categoryOptional,
  prepTimeMinutes: z
    .union([z.number(), z.string()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === null) return undefined;
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 ? n : undefined;
    }),
  cookTimeMinutes: z
    .union([z.number(), z.string()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === null) return undefined;
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 ? n : undefined;
    }),
  ingredients: z.array(
    z.object({
      name: z.union([z.string(), z.number()]).transform(String),
      quantity: z.union([z.number(), z.string()]).transform((v) => Number(v)),
      unit: unitWithFallback,
    }),
  ),
  instructions: z.union([
    z.string(),
    z.array(z.string()).transform((steps) => steps.join("\n\n")),
  ]),
  macros: z
    .object({
      calories: z.union([z.number(), z.string()]).optional().transform((v) => (v == null ? undefined : Number(v))),
      protein: z.union([z.number(), z.string()]).optional().transform((v) => (v == null ? undefined : Number(v))),
      fat: z.union([z.number(), z.string()]).optional().transform((v) => (v == null ? undefined : Number(v))),
      carbs: z.union([z.number(), z.string()]).optional().transform((v) => (v == null ? undefined : Number(v))),
    })
    .optional(),
});

export type RagMealOutput = z.infer<typeof ragMealOutputSchema>;
