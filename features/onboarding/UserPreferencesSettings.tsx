"use client";

import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import {
  AppetiteSection,
  BiometricsSection,
  DietarySection,
  DishTypePreferencesSection,
  LogisticsSection,
} from "./settings-sections";

export function UserPreferencesSettings() {
  const tSettings = useTranslations("settings");
  const data = useQuery(api.onboarding.queries.getPreferences);
  const [openSections, setOpenSections] = useState<string[]>([
    "biometrics",
    "dishTypes",
  ]);

  const toggleSection = (id: string) => {
    setOpenSections((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  if (data === undefined) {
    return <div className="text-muted-foreground">Loading preferences...</div>;
  }

  return (
    <div className="space-y-4 rounded-xl border p-6">
      <div>
        <h2 className="font-semibold text-lg">
          {tSettings("preferencesTitle")}
        </h2>
        <p className="text-muted-foreground text-sm">
          {tSettings("preferencesDescription")}
        </p>
      </div>

      <div className="space-y-2">
        <BiometricsSection
          open={openSections.includes("biometrics")}
          onOpenChange={() => toggleSection("biometrics")}
        />
        <DietarySection
          open={openSections.includes("dietary")}
          onOpenChange={() => toggleSection("dietary")}
        />
        <DishTypePreferencesSection
          open={openSections.includes("dishTypes")}
          onOpenChange={() => toggleSection("dishTypes")}
        />
        <LogisticsSection
          open={openSections.includes("logistics")}
          onOpenChange={() => toggleSection("logistics")}
        />
        <AppetiteSection
          open={openSections.includes("appetite")}
          onOpenChange={() => toggleSection("appetite")}
        />
      </div>
    </div>
  );
}
