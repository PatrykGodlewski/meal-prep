"use client";

import { useQuery } from "convex/react";
import { camelCase } from "lodash";
import { Loader2, Refrigerator } from "lucide-react";
import { useTranslations } from "next-intl";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import type { IngredientCategory } from "@/validators";
import { FridgeItem } from "./FridgeItem";

const LIDL_LAYOUT: (IngredientCategory | undefined)[] = [
  "grain",
  "fruit",
  "vegetable",
  "nut_seed",
  "spice_herb",
  "meat",
  "poultry",
  "fat_oil",
  "condiment",
  "legume",
  "baking",
  "sweetener",
  "dairy",
  "seafood",
  "beverage",
  "other",
  undefined,
];

export default function FridgeList() {
  const fridgeItems = useQuery(api.fridge.getFridge);
  const t = useTranslations("fridge");
  const tIngredient = useTranslations("ingredient");

  if (fridgeItems === undefined) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2
          className="h-10 w-10 animate-spin text-muted-foreground"
          aria-hidden
        />
      </div>
    );
  }

  if (fridgeItems.length === 0) {
    return (
      <output
        className={cn(
          "flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 py-16 text-center",
        )}
      >
        <Refrigerator className="mb-4 h-16 w-16 text-muted-foreground/50" />
        <p className="font-medium text-muted-foreground">{t("empty")}</p>
        <p className="mt-1 text-muted-foreground text-sm">{t("emptyHint")}</p>
      </output>
    );
  }

  const grouped = Object.groupBy(
    fridgeItems,
    (item) => item.ingredient?.category ?? "other",
  );

  const sortedCategories = Object.entries(grouped).sort(([catA], [catB]) => {
    const indexA = LIDL_LAYOUT.indexOf(catA as IngredientCategory);
    const indexB = LIDL_LAYOUT.indexOf(catB as IngredientCategory);
    if (indexA === -1 || indexB === -1) return 0;
    return indexA - indexB;
  });

  return (
    <div className="space-y-6">
      {sortedCategories.map(([category, items]) => {
        const sortedItems = [...(items ?? [])].sort((a, b) =>
          (a.ingredient?.name ?? "").localeCompare(b.ingredient?.name ?? ""),
        );
        const categoryLabel =
          tIngredient(camelCase(category) as never) || category;

        return (
          <section key={category} className="space-y-2">
            <h2 className="font-semibold text-muted-foreground text-sm uppercase tracking-wider">
              {categoryLabel}
            </h2>
            <ul className="space-y-2">
              {sortedItems.map((item) => (
                <FridgeItem key={item._id} item={item} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
