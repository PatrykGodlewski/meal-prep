import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { MealPlanOptions } from "@/features/meal-planner/meal-plan-options.client";

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <MealPlanOptions />
      <ThemeSwitcher />
      <LanguageSwitcher />
    </div>
  );
}
