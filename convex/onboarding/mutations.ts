import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import {
  ACTIVITY_LEVELS,
  ALLERGIES,
  BUDGET_TIERS,
  COOKING_SKILLS,
  DISH_TYPES,
  MAX_COOKING_TIME_OPTIONS,
  PRIMARY_GOALS,
  STRICT_DIETS,
} from "../schema";
import type { AuthMutationCtx } from "../custom/mutation";
import { authMutation } from "../custom/mutation";

const biometricsValidator = v.object({
  age: v.number(),
  gender: v.optional(v.string()),
  heightCm: v.optional(v.number()),
  weightKg: v.optional(v.number()),
  activityLevel: v.optional(
    v.union(...ACTIVITY_LEVELS.map((l) => v.literal(l))),
  ),
  primaryGoal: v.optional(
    v.union(...PRIMARY_GOALS.map((g) => v.literal(g))),
  ),
});

const dietaryValidator = v.object({
  strictDiets: v.array(v.union(...STRICT_DIETS.map((d) => v.literal(d)))),
  allergies: v.array(v.union(...ALLERGIES.map((a) => v.literal(a)))),
});

const logisticsValidator = v.object({
  mealsPerDay: v.optional(v.number()),
  snacksPerDay: v.optional(v.number()),
  maxCookingTimeMins: v.optional(
    v.union(...MAX_COOKING_TIME_OPTIONS.map((m) => v.literal(m))),
  ),
  cookingSkillLevel: v.optional(
    v.union(...COOKING_SKILLS.map((s) => v.literal(s))),
  ),
  budgetTier: v.optional(
    v.union(...BUDGET_TIERS.map((b) => v.literal(b))),
  ),
});

const dishTypeLiteral = v.union(
  ...DISH_TYPES.map((d) => v.literal(d)),
);
const dishTypesValidator = v.object({
  preferredTypes: v.array(dishTypeLiteral),
  avoidedTypes: v.array(dishTypeLiteral),
});

const appetiteValidator = v.object({
  prefersMealPrep: v.optional(v.boolean()),
});

async function getOrCreateUserPreferences(
  ctx: AuthMutationCtx,
): Promise<Id<"userPreferences">> {
  const existing = await ctx.db
    .query("userPreferences")
    .withIndex("by_user", (q) => q.eq("userId", ctx.user.id))
    .first();

  if (existing) return existing._id;

  const now = Date.now();
  return await ctx.db.insert("userPreferences", {
    userId: ctx.user.id,
    onboardingStep: 0,
    onboardingCompleted: false,
    createdAt: now,
    updatedAt: now,
  });
}

export const saveStep1 = authMutation({
  args: { biometrics: biometricsValidator },
  handler: async (ctx, { biometrics }) => {
    const prefsId = await getOrCreateUserPreferences(ctx);
    const prefs = await ctx.db.get(prefsId);
    if (!prefs) throw new Error("User preferences not found");

    const now = Date.now();
    await ctx.db.patch(prefsId, {
      biometrics,
      onboardingStep: 1,
      updatedAt: now,
    });

    return { success: true };
  },
});

export const saveStep2 = authMutation({
  args: { dietary: dietaryValidator },
  handler: async (ctx, { dietary }) => {
    const prefsId = await getOrCreateUserPreferences(ctx);
    const prefs = await ctx.db.get(prefsId);
    if (!prefs) throw new Error("User preferences not found");

    const now = Date.now();
    await ctx.db.patch(prefsId, {
      dietary,
      onboardingStep: 2,
      updatedAt: now,
    });

    return { success: true };
  },
});

export const saveStep3 = authMutation({
  args: { dishTypes: dishTypesValidator },
  handler: async (ctx, { dishTypes }) => {
    const prefsId = await getOrCreateUserPreferences(ctx);
    const prefs = await ctx.db.get(prefsId);
    if (!prefs) throw new Error("User preferences not found");

    const now = Date.now();
    await ctx.db.patch(prefsId, {
      dishTypes,
      onboardingStep: 3,
      updatedAt: now,
    });

    return { success: true };
  },
});

export const saveStep4 = authMutation({
  args: { logistics: logisticsValidator },
  handler: async (ctx, { logistics }) => {
    const prefsId = await getOrCreateUserPreferences(ctx);
    const prefs = await ctx.db.get(prefsId);
    if (!prefs) throw new Error("User preferences not found");

    const now = Date.now();
    await ctx.db.patch(prefsId, {
      logistics,
      onboardingStep: 4,
      updatedAt: now,
    });

    return { success: true };
  },
});

export const saveStep5 = authMutation({
  args: { appetite: appetiteValidator },
  handler: async (ctx, { appetite }) => {
    const prefsId = await getOrCreateUserPreferences(ctx);
    const prefs = await ctx.db.get(prefsId);
    if (!prefs) throw new Error("User preferences not found");

    const now = Date.now();
    await ctx.db.patch(prefsId, {
      appetite,
      onboardingStep: 5,
      onboardingCompleted: true,
      updatedAt: now,
    });

    return { success: true };
  },
});

/**
 * Settings-safe update mutations: patch preferences without changing
 * onboardingStep or onboardingCompleted.
 */

export const updateBiometrics = authMutation({
  args: { biometrics: biometricsValidator },
  handler: async (ctx, { biometrics }) => {
    const prefsId = await getOrCreateUserPreferences(ctx);
    const now = Date.now();
    await ctx.db.patch(prefsId, {
      biometrics,
      updatedAt: now,
    });
    return { success: true };
  },
});

export const updateDietary = authMutation({
  args: { dietary: dietaryValidator },
  handler: async (ctx, { dietary }) => {
    const prefsId = await getOrCreateUserPreferences(ctx);
    const now = Date.now();
    await ctx.db.patch(prefsId, {
      dietary,
      updatedAt: now,
    });
    return { success: true };
  },
});

export const updateDishTypes = authMutation({
  args: { dishTypes: dishTypesValidator },
  handler: async (ctx, { dishTypes }) => {
    const prefsId = await getOrCreateUserPreferences(ctx);
    await ctx.db.patch(prefsId, {
      dishTypes,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

export const updateLogistics = authMutation({
  args: { logistics: logisticsValidator },
  handler: async (ctx, { logistics }) => {
    const prefsId = await getOrCreateUserPreferences(ctx);
    await ctx.db.patch(prefsId, {
      logistics,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

export const updateAppetite = authMutation({
  args: { appetite: appetiteValidator },
  handler: async (ctx, { appetite }) => {
    const prefsId = await getOrCreateUserPreferences(ctx);
    await ctx.db.patch(prefsId, {
      appetite,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});
