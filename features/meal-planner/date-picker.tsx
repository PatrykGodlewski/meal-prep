"use client";
import { use$ } from "@legendapp/state/react";
import { addDays, endOfMonth, format, startOfMonth } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDateLocale } from "@/hooks/use-date-locale";
import { cn } from "@/lib/utils";
import { useMealPlanner } from "./store";
import { getMonday, getSaturday } from "./utils";

export function DatePickerWithPresets() {
  const { mealPlannerState$ } = useMealPlanner();
  const shoppingListDate = use$(mealPlannerState$.shoppingListDate);
  const dateLocale = useDateLocale();

  const handlePresetSelection = (value: string) => {
    const today = new Date();
    const currentMonday = getMonday(today);
    const currentSaturday = getSaturday(today);
    let fromDate: Date | undefined;
    let toDate: Date | undefined;

    switch (value) {
      case "0":
        fromDate = currentMonday;
        toDate = currentSaturday;
        break;
      case "7":
        fromDate = addDays(currentMonday, 7);
        toDate = addDays(currentSaturday, 7);
        break;
      case "14":
        fromDate = currentMonday;
        toDate = addDays(currentSaturday, 7);
        break;
      case "31":
        fromDate = startOfMonth(today);
        toDate = endOfMonth(today);
        break;
      default:
        fromDate = undefined;
        toDate = undefined;
    }

    if (!fromDate || !toDate) return;

    mealPlannerState$.shoppingListDate.set({ from: fromDate, to: toDate });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "flex-1 justify-start text-left font-normal sm:max-w-[280px]",
            !shoppingListDate && "text-muted-foreground",
          )}
          suppressHydrationWarning
        >
          <CalendarIcon />
          {shoppingListDate?.from ? (
            shoppingListDate.to ? (
              <>
                {format(shoppingListDate.from, "LLL dd, y", {
                  locale: dateLocale,
                })}{" "}
                -{" "}
                {format(shoppingListDate.to, "LLL dd, y", {
                  locale: dateLocale,
                })}
              </>
            ) : (
              format(shoppingListDate.from, "LLL dd, y")
            )
          ) : (
            <span>Pick a date</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="flex w-auto flex-col space-y-2 p-2">
        <Select onValueChange={handlePresetSelection}>
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="0">This week</SelectItem>
            <SelectItem value="7">Next week</SelectItem>
            <SelectItem value="14">Two weeks</SelectItem>
            <SelectItem value="31">Month</SelectItem>
          </SelectContent>
        </Select>
        <div className="rounded-md border">
          <Calendar
            mode="range"
            selected={shoppingListDate}
            onSelect={(selected) =>
              mealPlannerState$.shoppingListDate.set(selected)
            }
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
