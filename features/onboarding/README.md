# Onboarding Domain

Single domain for onboarding flow and user preferences. All related UI and logic live here for easy refactoring.

## Structure

```
features/onboarding/
├── index.ts                 # Public API - import from here
├── constants.ts             # DEBOUNCE_MS, ONBOARDING_STEP_COUNT
├── schemas.ts               # Shared Zod schemas (biometrics, dietary, etc.)
├── AppWrapper.tsx           # Root layout: OnboardingGuard + ConditionalAppShell
├── OnboardingGuard.tsx      # Redirects incomplete users to /onboarding
├── ConditionalAppShell.tsx  # Hides sidebar on onboarding routes
├── OnboardingProgress.tsx   # Step 1-5 progress indicator
├── OnboardingLayout.tsx     # Layout for onboarding pages
├── OnboardingRedirectPage.tsx # /onboarding redirect logic
├── Step1Form.tsx            # Biometrics (age, gender, height, weight, etc.)
├── Step2Form.tsx            # Dietary restrictions
├── Step3Form.tsx            # Ingredient preferences (always/never include)
├── Step4Form.tsx            # Logistics (meals/day, cooking time, budget)
├── Step5Form.tsx            # Appetite (meal prep vs variety)
├── UserPreferencesSettings.tsx # Settings page - composes section components
├── components/
│   ├── StepHeader.tsx       # Reusable step title + subtitle
│   └── StepNavigation.tsx   # Back / Next buttons
└── settings-sections/
    ├── index.ts
    ├── BiometricsSection.tsx
    ├── DietarySection.tsx
    ├── DishTypePreferencesSection.tsx
    ├── LogisticsSection.tsx
    └── AppetiteSection.tsx
```

## Backend

Convex functions in `convex/onboarding/`:

- `queries.ts`: getOnboardingStatus, getPreferencesForStep, getPreferences
- `mutations.ts`: saveStep1-5 (onboarding), update* (settings-safe)

## Usage

```ts
import { AppWrapper, Step1Form, UserPreferencesSettings } from "@/features/onboarding";
```
