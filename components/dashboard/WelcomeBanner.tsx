"use client";

import { useTranslations } from "next-intl";

export function WelcomeBanner() {
  const t = useTranslations("personalizedDiet");

  return (
    <p className="text-muted-foreground text-sm sm:text-base">
      {t("pageDescription")}
    </p>
  );
}
