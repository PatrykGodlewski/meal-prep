"use client";

import type { Doc } from "@/convex/_generated/dataModel";
import {
  ChevronDown,
  Check,
  Clock,
  Dumbbell,
  Flame,
  ImageIcon,
  RefreshCw,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getMealKcal } from "@/lib/plan-kcal";

const ACCENT_PRESETS: { accentColor: string; accentBg: string }[] = [
  { accentColor: "text-amber-600", accentBg: "bg-amber-50 dark:bg-amber-950/40" },
  { accentColor: "text-emerald-700", accentBg: "bg-emerald-50 dark:bg-emerald-950/40" },
  { accentColor: "text-sky-600", accentBg: "bg-sky-50 dark:bg-sky-950/40" },
  { accentColor: "text-pink-600", accentBg: "bg-pink-50 dark:bg-pink-950/40" },
  { accentColor: "text-slate-600", accentBg: "bg-slate-100 dark:bg-slate-800/40" },
];

const TIME_OPTIONS = [
  "6:00", "6:30", "7:00", "7:30", "8:00", "8:30", "9:00", "9:30",
  "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30",
];

const DEFAULT_TIMES: Record<string, string> = {
  breakfast: "7:00",
  lunch: "12:00",
  dinner: "19:00",
  snack: "15:00",
  dessert: "20:00",
  drinks: "10:00",
};

type PlanMealWithMeal = {
  _id: string;
  mealId: string;
  meal: Doc<"meals"> | null;
  servingAmount?: number;
  eatenAt?: number | null;
  scheduledTime?: string;
  category?: string;
};

type Props = {
  plannedMeal: PlanMealWithMeal;
  mealTypeLabel: string;
  accentColor: string;
  accentBg: string;
  isLast: boolean;
  servings: number;
  onSwap: () => void;
  onMarkEaten: () => void;
  onTimeChange?: (time: string) => void;
};

export function PlanMealCard({
  plannedMeal,
  mealTypeLabel,
  accentColor,
  accentBg,
  isLast,
  servings,
  onSwap,
  onMarkEaten,
  onTimeChange,
}: Props) {
  const t = useTranslations("mealPlanner");
  const meal = plannedMeal.meal;
  const category = plannedMeal.category ?? "breakfast";
  const imageUrl = meal?.imageUrl ?? "/placeholder.png";
  const initialTime =
    plannedMeal.scheduledTime ?? DEFAULT_TIMES[category] ?? "12:00";
  const [time, setTime] = useState(initialTime);
  const [open, setOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const next =
      plannedMeal.scheduledTime ?? DEFAULT_TIMES[category] ?? "12:00";
    setTime(next);
  }, [plannedMeal.scheduledTime, category]);

  useEffect(() => {
    setImageError(false);
  }, [imageUrl]);

  const calories = meal ? Math.round(getMealKcal(plannedMeal, servings)) : 0;
  const prepTime = meal?.prepTimeMinutes
    ? `${meal.prepTimeMinutes} min`
    : "—";

  const handleTimeSelect = (newTime: string) => {
    setTime(newTime);
    onTimeChange?.(newTime);
    setOpen(false);
  };

  const dotBg = accentColor.replace("text-", "bg-");
  const isEaten = !!plannedMeal.eatenAt;

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
          <PopoverContent align="center" className="max-h-48 w-24 overflow-y-auto p-1">
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

        <div className={cn("mt-2 h-3 w-3 rounded-full border-2 border-background shadow-sm", dotBg)} />
        {!isLast && <div className="mt-2 w-0.5 flex-1 rounded-full bg-border" />}
      </div>

      {/* Meal card */}
      <Link
        href={meal ? `/meals/${meal._id}` : "#"}
        className={cn(
          "group relative flex min-w-0 flex-1 gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md",
          isEaten && "opacity-75",
        )}
      >
        <div className="relative z-10 flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted sm:h-24 sm:w-24">
          {imageError ? (
            <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
          ) : (
            <Image
              src={imageUrl}
              alt={meal?.name ?? "Meal"}
              width={96}
              height={96}
              className="h-full w-full object-cover"
              unoptimized={imageUrl.startsWith("/")}
              onError={() => setImageError(true)}
            />
          )}
        </div>

        <div className="relative z-10 min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span
              className={cn(
                "rounded-md px-2 py-0.5 font-bold text-[10px] uppercase tracking-wider",
                accentColor,
                accentBg,
              )}
            >
              {mealTypeLabel}
            </span>
            <div className="flex shrink-0 gap-1">
              <Button
                variant={isEaten ? "default" : "outline"}
                size="icon"
                className="h-8 w-8"
                aria-label={isEaten ? t("unmarkAsEaten") : t("markAsEaten")}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onMarkEaten();
                }}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground/50 opacity-0 transition-opacity hover:bg-primary/10 hover:text-primary group-hover:opacity-100"
                aria-label={t("changeMeal")}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSwap();
                }}
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <h3 className="mt-1 truncate font-bold text-base text-foreground leading-snug">
            {meal?.name ?? "—"}
          </h3>

          <div className="mt-2 flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Flame className="h-3.5 w-3.5 text-primary" />
              <span className="font-bold text-foreground text-sm">{calories}</span>
              <span className="text-[10px] text-muted-foreground">kcal</span>
            </div>
            <div className="flex items-center gap-1">
              <Dumbbell className="h-3.5 w-3.5 text-primary" />
              <span className="font-bold text-foreground text-sm">—</span>
              <span className="text-[10px] text-muted-foreground">protein</span>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-3 text-muted-foreground text-xs">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{prepTime}</span>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-1 text-muted-foreground text-xs sm:hidden">
            <Clock className="h-3 w-3" />
            <span>{time}</span>
          </div>
        </div>
      </Link>
    </div>
  );
}

export { ACCENT_PRESETS };
