/**
 * BMR and TDEE calculations using Mifflin-St Jeor equation.
 * Activity multipliers and goal adjustments align with evidence-based guidelines.
 */

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_KCAL_ADJUSTMENT: Record<string, number> = {
  weight_loss: -500,
  maintenance: 0,
  muscle_gain: 300,
};

export type TDEEInput = {
  age: number;
  gender?: string;
  heightCm: number;
  weightKg: number;
  activityLevel: string;
  primaryGoal?: string;
};

export type MacroTargets = {
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
};

export type TDEEOutput = {
  bmrKcal: number;
  tdeeKcal: number;
  dailyKcalTarget: number;
  macroTargets: MacroTargets;
};

/**
 * Mifflin-St Jeor BMR formula.
 * Men: (10 × weightKg) + (6.25 × heightCm) - (5 × age) + 5
 * Women: (10 × weightKg) + (6.25 × heightCm) - (5 × age) - 161
 */
export function calculateBMR(age: number, weightKg: number, heightCm: number, gender?: string): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const genderAdjustment = gender?.toLowerCase() === "female" ? -161 : 5;
  return Math.round(base + genderAdjustment);
}

/**
 * TDEE = BMR × activity multiplier.
 */
export function calculateTDEE(bmr: number, activityLevel: string): number {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] ?? 1.2;
  return Math.round(bmr * multiplier);
}

/**
 * Daily calorie target = TDEE + goal adjustment.
 */
export function calculateDailyKcalTarget(tdee: number, primaryGoal?: string): number {
  const adjustment = primaryGoal ? GOAL_KCAL_ADJUSTMENT[primaryGoal] ?? 0 : 0;
  return Math.max(1200, Math.round(tdee + adjustment));
}

/**
 * Macro split based on goal. Returns grams for protein, carbs, fat.
 * - Weight loss: higher protein (35%), moderate carbs (35%), moderate fat (30%)
 * - Maintenance: balanced 30/40/30
 * - Muscle gain: higher protein (35%), higher carbs (45%), moderate fat (20%)
 */
export function calculateMacroTargets(
  dailyKcal: number,
  primaryGoal?: string
): MacroTargets {
  const kcals = dailyKcal;
  let proteinPct: number;
  let carbPct: number;
  let fatPct: number;

  switch (primaryGoal) {
    case "weight_loss":
      proteinPct = 0.35;
      carbPct = 0.35;
      fatPct = 0.3;
      break;
    case "muscle_gain":
      proteinPct = 0.35;
      carbPct = 0.45;
      fatPct = 0.2;
      break;
    case "maintenance":
    default:
      proteinPct = 0.3;
      carbPct = 0.4;
      fatPct = 0.3;
      break;
  }

  const proteinGrams = Math.round((kcals * proteinPct) / 4);
  const carbGrams = Math.round((kcals * carbPct) / 4);
  const fatGrams = Math.round((kcals * fatPct) / 9);

  return { proteinGrams, carbGrams, fatGrams };
}

/**
 * Full TDEE pipeline: BMR → TDEE → daily target → macros.
 */
export function computeTDEEOutput(input: TDEEInput): TDEEOutput {
  const bmr = calculateBMR(
    input.age,
    input.weightKg,
    input.heightCm,
    input.gender
  );
  const tdee = calculateTDEE(bmr, input.activityLevel);
  const dailyKcalTarget = calculateDailyKcalTarget(tdee, input.primaryGoal);
  const macroTargets = calculateMacroTargets(dailyKcalTarget, input.primaryGoal);

  return {
    bmrKcal: bmr,
    tdeeKcal: tdee,
    dailyKcalTarget,
    macroTargets,
  };
}
