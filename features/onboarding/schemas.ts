import { z } from "zod";
import {
  ACTIVITY_LEVELS,
  ALLERGIES,
  BUDGET_TIERS,
  COOKING_SKILLS,
  DISH_TYPES,
  MAX_COOKING_TIME_OPTIONS,
  PRIMARY_GOALS,
  STRICT_DIETS,
} from "@/convex/schema";

const optionalNumber = (min: number, max: number) =>
  z
    .union([z.coerce.number().int().min(min).max(max), z.undefined()])
    .optional();

export const biometricsSchema = z.object({
  age: z.coerce.number().int().min(1).max(120),
  gender: z.string().optional(),
  heightCm: optionalNumber(1, 300),
  weightKg: optionalNumber(1, 500),
  activityLevel: z
    .enum(ACTIVITY_LEVELS as unknown as [string, ...string[]])
    .optional(),
  primaryGoal: z
    .enum(PRIMARY_GOALS as unknown as [string, ...string[]])
    .optional(),
});

export const dietarySchema = z.object({
  strictDiets: z.array(z.enum(STRICT_DIETS as unknown as [string, ...string[]])),
  allergies: z.array(z.enum(ALLERGIES as unknown as [string, ...string[]])),
});

export const logisticsSchema = z.object({
  mealsPerDay: optionalNumber(1, 10),
  snacksPerDay: optionalNumber(0, 10),
  maxCookingTimeMins: z
    .union([z.number().int(), z.undefined()])
    .optional()
    .refine(
      (v) =>
        v === undefined ||
        MAX_COOKING_TIME_OPTIONS.includes(
          v as (typeof MAX_COOKING_TIME_OPTIONS)[number],
        ),
      { message: "Invalid option" },
    ),
  cookingSkillLevel: z
    .enum(COOKING_SKILLS as unknown as [string, ...string[]])
    .optional(),
  budgetTier: z
    .enum(BUDGET_TIERS as unknown as [string, ...string[]])
    .optional(),
});

export const appetiteSchema = z.object({
  prefersMealPrep: z.boolean().optional(),
});

export const dishTypesSchema = z.object({
  preferredTypes: z.array(
    z.enum(DISH_TYPES as unknown as [string, ...string[]]),
  ),
  avoidedTypes: z.array(z.enum(DISH_TYPES as unknown as [string, ...string[]])),
});

export type BiometricsValues = z.infer<typeof biometricsSchema>;
export type DietaryValues = z.infer<typeof dietarySchema>;
export type LogisticsValues = z.infer<typeof logisticsSchema>;
export type AppetiteValues = z.infer<typeof appetiteSchema>;
export type DishTypesValues = z.infer<typeof dishTypesSchema>;
