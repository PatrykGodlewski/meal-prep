"use client";

import { addDays, format, startOfWeek } from "date-fns";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  value: Date;
  onChange: (date: Date) => void;
};

export function WeekDaysNav({ value, onChange }: Props) {
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
    <div className="flex gap-1 overflow-x-auto rounded-2xl border border-border/60 bg-muted/30 p-1">
      {weekDays.map((day) => {
        const active = isToday(day);
        const selected = isSelected(day);
        return (
          <Button
            key={day.toISOString()}
            variant="ghost"
            size="sm"
            onClick={() => onChange(day)}
            className={cn(
              "shrink-0 rounded-xl px-4 py-2.5 font-medium transition-all",
              selected &&
                "bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground",
              !selected &&
                active &&
                "bg-primary/20 text-primary hover:bg-primary/30",
              !selected && !active && "text-muted-foreground",
            )}
          >
            {active ? t("today") : format(day, "EEE")}
          </Button>
        );
      })}
    </div>
  );
}
