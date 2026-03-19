"use client";

import {
  Download,
  RefreshCw,
  Settings,
  ShoppingCart,
  SortAsc,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { DietOutput } from "@/lib/validations/diet";

export type DateRangePreset = "today" | "next3" | "fullWeek";

type GroceryItem = { id: string; name: string; qty: string; checked: boolean };
type Category = { label: string; items: GroceryItem[] };

const TIMEFRAMES: { key: DateRangePreset; label: string }[] = [
  { key: "today", label: "For Today" },
  { key: "next3", label: "Next 3 Days" },
  { key: "fullWeek", label: "Whole Week" },
];

function categorizeIngredient(name: string): string {
  const n = name.toLowerCase();
  const produce =
    /avocado|tomato|spinach|broccoli|potato|berry|berry|fruit|lettuce|carrot|onion|garlic|cucumber|pepper|apple|banana|orange|lemon|lime|mango/;
  const meatDairy =
    /chicken|salmon|beef|pork|egg|yogurt|milk|cheese|turkey|tuna|fish/;
  const pantry =
    /quinoa|rice|bread|oat|pasta|flour|oil|vinegar|tahini|granola|nut|almond|honey|maple|sauce|spice|herb/;
  if (produce.test(n)) return "Produce";
  if (meatDairy.test(n)) return "Meat & Dairy";
  if (pantry.test(n)) return "Pantry";
  return "Other";
}

function dietToCategories(diet: DietOutput): Category[] {
  const map = new Map<string, { name: string; qty: number }>();
  for (const meal of diet.meals) {
    for (const ing of meal.ingredients) {
      const key = ing.name.toLowerCase().trim();
      const existing = map.get(key);
      const qty = ing.quantityGrams;
      if (existing) {
        existing.qty += qty;
      } else {
        map.set(key, { name: ing.name, qty });
      }
    }
  }

  const byCategory = new Map<string, GroceryItem[]>();
  let id = 0;
  for (const [, { name, qty }] of map) {
    const cat = categorizeIngredient(name);
    const list = byCategory.get(cat) ?? [];
    list.push({
      id: `ing-${id++}`,
      name,
      qty: `${qty}g`,
      checked: false,
    });
    byCategory.set(cat, list);
  }

  const order = ["Produce", "Meat & Dairy", "Pantry", "Other"];
  return order
    .filter((l) => byCategory.has(l))
    .map((label) => ({
      label,
      items: (byCategory.get(label) ?? []).sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    }));
}

type Props = {
  diet: DietOutput;
};

export function DietShoppingList({ diet }: Props) {
  const t = useTranslations("personalizedDiet");
  const [timeframe, setTimeframe] = useState<DateRangePreset>("today");
  const [categories, setCategories] = useState<Category[]>(() =>
    dietToCategories(diet),
  );

  useEffect(() => {
    setCategories(dietToCategories(diet));
  }, [diet]);

  const clearChecked = useCallback(
    () =>
      setCategories((prev) =>
        prev.map((cat) => ({
          ...cat,
          items: cat.items.filter((i) => !i.checked),
        })),
      ),
    [],
  );

  const sortAlpha = useCallback(
    () =>
      setCategories((prev) =>
        prev.map((cat) => ({
          ...cat,
          items: [...cat.items].sort((a, b) => a.name.localeCompare(b.name)),
        })),
      ),
    [],
  );

  const resetList = useCallback(
    () => setCategories(dietToCategories(diet)),
    [diet],
  );

  const toggleItem = useCallback((categoryIndex: number, itemId: string) => {
    setCategories((prev) =>
      prev.map((cat, ci) =>
        ci === categoryIndex
          ? {
              ...cat,
              items: cat.items.map((item) =>
                item.id === itemId ? { ...item, checked: !item.checked } : item,
              ),
            }
          : cat,
      ),
    );
  }, []);

  const totalItems = categories.flatMap((c) => c.items).length;
  const checkedItems = categories
    .flatMap((c) => c.items)
    .filter((i) => i.checked).length;
  const progress =
    totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
      <div className="border-border border-b px-5 pt-5 pb-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
              <ShoppingCart className="h-4 w-4 text-primary" />
            </div>
            <h2 className="font-extrabold text-foreground text-lg">
              {t("shoppingList")}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-muted-foreground text-xs">
              {checkedItems}/{totalItems}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-xl"
                  aria-label="Shopping list settings"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-2xl">
                <DropdownMenuItem
                  onClick={() => {
                    sortAlpha();
                  }}
                >
                  <SortAsc className="h-4 w-4" />
                  Sort alphabetically
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    clearChecked();
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Clear checked items
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {}}>
                  <Download className="h-4 w-4" />
                  Export list
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    resetList();
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                  Reset to default
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div
          className="mb-4 h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex gap-0.5 rounded-2xl bg-muted p-1">
          {TIMEFRAMES.map(({ key }) => (
            <Button
              key={key}
              variant="ghost"
              size="sm"
              onClick={() => setTimeframe(key)}
              className={cn(
                "h-auto flex-1 rounded-xl px-2 py-1.5 font-semibold text-xs transition-all",
                timeframe === key &&
                  "bg-card text-foreground shadow-sm hover:bg-card hover:text-foreground",
                timeframe !== key &&
                  "text-muted-foreground hover:text-foreground",
              )}
            >
              {key === "today"
                ? t("dateFilterToday")
                : key === "next3"
                  ? t("dateFilterNext3")
                  : t("dateFilterFullWeek")}
            </Button>
          ))}
        </div>
      </div>

      <div className="max-h-[580px] flex-1 space-y-5 overflow-y-auto px-5 py-3">
        {categories.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground text-sm">
            No ingredients
          </p>
        ) : (
          categories.map((cat, ci) => (
            <div key={cat.label}>
              <p className="mb-2 px-1 font-bold text-muted-foreground text-xs uppercase tracking-widest">
                {cat.label}
              </p>
              <ul className="space-y-1.5">
                {cat.items.map((item) => (
                  <li key={item.id}>
                    <Label
                      htmlFor={item.id}
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-muted/50",
                        item.checked && "bg-muted/60",
                      )}
                    >
                      <Checkbox
                        id={item.id}
                        checked={item.checked}
                        onCheckedChange={() => toggleItem(ci, item.id)}
                        className="rounded-full border-2"
                      />
                      <span
                        className={cn(
                          "flex-1 font-medium text-sm",
                          item.checked && "text-muted-foreground line-through",
                        )}
                      >
                        {item.name}
                      </span>
                      <span className="flex-shrink-0 text-muted-foreground text-xs">
                        {item.qty}
                      </span>
                    </Label>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
