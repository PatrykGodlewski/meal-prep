"use client";

import { ChevronDown, Clock, Dumbbell, Flame, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { DietMeal } from "@/lib/validations/diet";

export type Macros = {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

const ACCENT_PRESETS: { accentColor: string; accentBg: string }[] = [
  {
    accentColor: "text-amber-600",
    accentBg: "bg-amber-50 dark:bg-amber-950/40",
  },
  {
    accentColor: "text-emerald-700",
    accentBg: "bg-emerald-50 dark:bg-emerald-950/40",
  },
  { accentColor: "text-sky-600", accentBg: "bg-sky-50 dark:bg-sky-950/40" },
  { accentColor: "text-pink-600", accentBg: "bg-pink-50 dark:bg-pink-950/40" },
  {
    accentColor: "text-slate-600",
    accentBg: "bg-slate-100 dark:bg-slate-800/40",
  },
];

const TIME_OPTIONS = [
  "6:00",
  "6:30",
  "7:00",
  "7:30",
  "8:00",
  "8:30",
  "9:00",
  "9:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
];

const DEFAULT_TIMES = ["7:00", "11:30", "15:00", "19:00"];

type Props = {
  meal: DietMeal;
  mealType: string;
  macros: Macros;
  prepTime: string;
  accentColor: string;
  accentBg: string;
  scheduledTime: string;
  isLast?: boolean;
  onTimeChange?: (time: string) => void;
  onSwap?: () => void;
};

export function MealCard({
  meal,
  mealType,
  macros,
  prepTime,
  accentColor,
  accentBg,
  scheduledTime,
  isLast = false,
  onTimeChange,
  onSwap,
}: Props) {
  const t = useTranslations("personalizedDiet");
  const [time, setTime] = useState(scheduledTime);
  const [open, setOpen] = useState(false);

  const handleTimeSelect = (newTime: string) => {
    setTime(newTime);
    onTimeChange?.(newTime);
    setOpen(false);
  };

  const dotBg = accentColor.replace("text-", "bg-");

  return (
    <div className="flex gap-4">
      {/* Timeline column */}
      <div className="hidden w-16 flex-shrink-0 flex-col items-center sm:flex">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-auto gap-1 px-2 py-1 font-bold text-xs tabular-nums",
                open && "bg-primary/10 text-primary",
              )}
            >
              {time}
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="center"
            className="max-h-48 w-24 overflow-y-auto p-1"
          >
            {TIME_OPTIONS.map((opt) => (
              <Button
                key={opt}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 w-full justify-start px-3 text-xs tabular-nums",
                  opt === time && "bg-primary/10 font-semibold text-primary",
                )}
                onClick={() => handleTimeSelect(opt)}
              >
                {opt}
              </Button>
            ))}
          </PopoverContent>
        </Popover>

        <div
          className={cn(
            "mt-2 h-3 w-3 rounded-full border-2 border-background shadow-sm",
            dotBg,
          )}
        />

        {!isLast && (
          <div className="mt-2 w-0.5 flex-1 rounded-full bg-border" />
        )}
      </div>

      {/* Meal card */}
      <article className="group flex min-w-0 flex-1 gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
        {/* Image placeholder */}
        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 sm:h-24 sm:w-24">
          <Flame className="h-8 w-8 text-primary/40" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span
              className={cn(
                "rounded-md px-2 py-0.5 font-bold text-[10px] uppercase tracking-wider",
                accentColor,
                accentBg,
              )}
            >
              {mealType}
            </span>
            {onSwap && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0 text-muted-foreground/50 opacity-0 transition-opacity hover:bg-primary/10 hover:text-primary group-hover:opacity-100"
                aria-label={t("swap")}
                title={t("swap")}
                onClick={onSwap}
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          <h3 className="mt-1 truncate font-bold text-base text-foreground leading-snug">
            {meal.name}
          </h3>

          <div className="mt-2 flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Flame className="h-3.5 w-3.5 text-primary" />
              <span className="font-bold text-foreground text-sm">
                {macros.calories}
              </span>
              <span className="text-[10px] text-muted-foreground">kcal</span>
            </div>
            <div className="flex items-center gap-1">
              <Dumbbell className="h-3.5 w-3.5 text-primary" />
              <span className="font-bold text-foreground text-sm">
                {macros.protein}g
              </span>
              <span className="text-[10px] text-muted-foreground">protein</span>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-3 text-muted-foreground text-xs">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{prepTime}</span>
            </div>
            <span className="text-border">|</span>
            <span>{macros.carbs}g carbs</span>
            <span className="text-border">|</span>
            <span>{macros.fats}g fats</span>
          </div>

          <details className="group/details mt-3">
            <summary className="cursor-pointer list-none font-medium text-muted-foreground text-xs hover:text-foreground [&::-webkit-details-marker]:hidden">
              {t("ingredients")} · {t("prepInstructions")}
            </summary>
            <div className="mt-2 space-y-2 text-sm">
              <div>
                <p className="mb-1 font-medium text-muted-foreground text-xs">
                  {t("ingredients")}
                </p>
                <ul className="list-inside list-disc space-y-0.5 text-muted-foreground">
                  {meal.ingredients.map((ing, i) => (
                    <li key={i}>
                      {ing.quantityGrams}g {ing.name}
                      {ing.visualPortion && ` (${ing.visualPortion})`}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-1 font-medium text-muted-foreground text-xs">
                  {t("prepInstructions")}
                </p>
                <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                  {meal.prepInstructions}
                </p>
              </div>
            </div>
          </details>

          <div className="mt-2 flex items-center gap-1 text-muted-foreground text-xs sm:hidden">
            <Clock className="h-3 w-3" />
            <span>{time}</span>
          </div>
        </div>
      </article>
    </div>
  );
}

export { ACCENT_PRESETS, DEFAULT_TIMES };
