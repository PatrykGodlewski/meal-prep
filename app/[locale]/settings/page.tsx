import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users2 } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="serving-size">Serving Size</Label>

        <div className="flex gap-4 items-center">
          <Users2 />
          <Input
            className="max-w-24"
            id="serving-size"
            type="number"
            placeholder="e.g. 4"
          />
        </div>
      </div>
      <ThemeSwitcher />
      <LanguageSwitcher />
    </div>
  );
}
