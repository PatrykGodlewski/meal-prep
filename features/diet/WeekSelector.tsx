"use client";

import { addDays, format, startOfWeek } from "date-fns";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

type Props = {
  value: Date;
  onChange: (date: Date) => void;
  className?: string;
};

export function WeekSelector({ value, onChange, className }: Props) {
  const t = useTranslations("personalizedDiet");
  const weekDays = useMemo(() => {
    const monday = startOfWeek(value, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  }, [value]);

  const today = new Date();
  const isToday = (d: Date) =>
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();

  const isSelected = (d: Date) =>
    d.getDate() === value.getDate() &&
    d.getMonth() === value.getMonth() &&
    d.getFullYear() === value.getFullYear();

  return (
    <div
      className={cn(
        "flex gap-1 overflow-x-auto rounded-2xl border border-border/60 bg-muted/30 p-1",
        className,
      )}
    >
      {weekDays.map((day) => {
        const active = isToday(day);
        const selected = isSelected(day);
        return (
          <button
            key={day.toISOString()}
            type="button"
            onClick={() => onChange(day)}
            className={cn(
              "shrink-0 rounded-xl px-4 py-2.5 font-medium text-sm transition-all",
              selected
                ? "bg-primary text-primary-foreground shadow-sm"
                : active
                  ? "bg-primary/20 text-primary hover:bg-primary/30"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {active ? t("today") : format(day, "EEE")}
          </button>
        );
      })}
    </div>
  );
}
