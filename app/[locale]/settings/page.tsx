import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { MealPlanOptions } from "@/features/meal-planner/meal-plan-options.client";
import { UserPreferencesSettings } from "@/features/onboarding";

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <UserPreferencesSettings />
      <MealPlanOptions />
      <ThemeSwitcher />
      <LanguageSwitcher />
    </div>
  );
}
