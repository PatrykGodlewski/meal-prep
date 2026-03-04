/**
 * Nutrition calculation helpers.
 * Standard: ingredient.calories = kcal per 100g.
 * Quantity must be converted to grams for calculation.
 */

// Approximate conversion from unit to grams (for kcal per 100g calculation)
const UNIT_TO_GRAMS: Record<string, number> = {
  g: 1,
  kg: 1000,
  ml: 1,
  l: 1000,
  tsp: 5,
  tbsp: 15,
  cup: 240,
  oz: 28.35,
  lb: 453.6,
  piece: 100, // default estimate
  pinch: 0.5,
};

export function quantityToGrams(quantity: number, unit: string): number {
  const factor = UNIT_TO_GRAMS[unit] ?? 1;
  return quantity * factor;
}

/**
 * Calculate kcal for one ingredient in a meal.
 * ingredient.calories = kcal per 100g (standard nutrition data).
 */
export function calculateIngredientKcal(
  quantity: number,
  unit: string,
  caloriesPer100g: number | undefined,
): number {
  if (!caloriesPer100g || caloriesPer100g <= 0) return 0;
  const grams = quantityToGrams(quantity, unit);
  return Math.round((grams / 100) * caloriesPer100g);
}
