"use client";

import { useTranslations } from "next-intl";

type Props = {
  /** Optional description override. When not provided, uses personalizedDiet.pageDescription */
  description?: string;
};

export function WelcomeBanner({ description }: Props) {
  const t = useTranslations("personalizedDiet");

  return (
    <p className="text-muted-foreground text-sm sm:text-base">
      {description ?? t("pageDescription")}
    </p>
  );
}
