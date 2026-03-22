/**
 * Meal planner logic: hard filtering + weighted scoring.
 * Plain TypeScript helpers – no Convex wrappers. Used by queries/actions.
 */

import type { Doc, Id } from "../_generated/dataModel";

const RATING_SCALE = 10; // 4.5 rating → 45 base points
const DEFAULT_RATING = 3;
const PREP_TIME_PENALTY_PER_MIN_OVER = 0.5;

/** Hard filter: meal contains none of the user's allergens. */
export function mealPassesAllergyFilter(
  mealAllergens: string[] | undefined,
  userAllergies: string[],
): boolean {
  if (userAllergies.length === 0) return true;
  if (!mealAllergens || mealAllergens.length === 0) return true;
  const set = new Set(mealAllergens);
  return !userAllergies.some((a) => set.has(a));
}

/** Score one meal for personalized ranking. */
export function scoreMeal(
  meal: Doc<"meals">,
  ingredientIds: Id<"ingredients">[],
  ingredientWeights: Record<string, number>,
  maxCookingTimeMins: number | undefined,
): number {
  let score = (meal.communityRating ?? DEFAULT_RATING) * RATING_SCALE;

  for (const id of ingredientIds) {
    const w = ingredientWeights[id as string];
    if (w !== undefined) score += w;
  }

  const prepMins = meal.prepTimeMinutes ?? 0;
  const cookMins = meal.cookTimeMinutes ?? 0;
  const totalMins = prepMins + cookMins;
  if (maxCookingTimeMins !== undefined && totalMins > maxCookingTimeMins) {
    score -= (totalMins - maxCookingTimeMins) * PREP_TIME_PENALTY_PER_MIN_OVER;
  }

  return Math.round(score * 10) / 10;
}
