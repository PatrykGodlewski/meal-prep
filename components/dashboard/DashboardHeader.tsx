"use client";

import { Printer } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

type Props = {
  title?: string;
  onRegenerate?: () => void;
  regenerateLabel?: string;
  onPrint?: () => void;
  printLabel?: string;
};

export function DashboardHeader({
  title,
  onRegenerate,
  regenerateLabel,
  onPrint,
  printLabel,
}: Props) {
  const t = useTranslations("personalizedDiet");

  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <h1 className="font-bold text-2xl tracking-tight sm:text-3xl">
        {title ?? t("pageTitle")}
      </h1>
      <div className="flex items-center gap-2 print:hidden">
        {onRegenerate && (
          <Button variant="outline" size="sm" onClick={onRegenerate}>
            {regenerateLabel ?? t("regenerate")}
          </Button>
        )}
        {onPrint && (
          <Button variant="outline" size="sm" onClick={onPrint}>
            <Printer className="mr-2 h-4 w-4" />
            {printLabel ?? t("print")}
          </Button>
        )}
      </div>
    </header>
  );
}
