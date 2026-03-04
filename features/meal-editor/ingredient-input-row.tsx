"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useMemo } from "react";
import type { Control, UseFormSetValue } from "react-hook-form";
import { useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import type { Doc } from "@/convex/_generated/dataModel";
import { IngredientBasicFields } from "./components/ingredient-basic-fields";
import { IngredientReplacementsField } from "./components/ingredient-replacements-field";
import { IngredientSelector } from "./components/ingredient-selector";

interface IngredientInputRowProps {
  index: number;
  control: Control<any>;
  availableIngredients: Doc<"ingredients">[];
  onRemove: () => void;
  setValue: UseFormSetValue<any>;
  // biome-ignore lint/suspicious/noExplicitAny: useFieldArray field
  field: any;
}

export const IngredientInputRow = React.memo(function IngredientInputRow({
  index,
  control,
  availableIngredients,
  onRemove,
  setValue,
  field,
}: IngredientInputRowProps) {
  const tMeal = useTranslations("mealEditor");

  const ingredientId = useWatch({ control, name: `ingredients.${index}.ingredientId` });
  const ingredientDefId = ingredientId ?? field.ingredientId ?? field.id;

  const selectedIngredient = useMemo(
    () => availableIngredients.find((ing) => ing._id === ingredientId),
    [availableIngredients, ingredientId],
  );

  const defaultReplacementEntries =
    (selectedIngredient as { replacements?: { ingredientId: string; ratio?: number }[] })
      ?.replacements ??
    ((selectedIngredient as { replacementIds?: string[] })?.replacementIds ?? []).map(
      (id) => ({ ingredientId: id, ratio: 1 }),
    );
  const hasReplacements = defaultReplacementEntries.length > 0;
  const replacementOptions = hasReplacements
    ? defaultReplacementEntries
        .map((entry) => {
          const ing = availableIngredients.find((i) => i._id === entry.ingredientId);
          return ing
            ? { label: ing.name, value: ing._id, defaultRatio: entry.ratio ?? 1 }
            : null;
        })
        .filter((o) => o !== null) as {
          label: string;
          value: string;
          defaultRatio: number;
        }[]
    : availableIngredients
        .filter((i) => i._id !== ingredientDefId)
        .map((i) => ({ label: i.name, value: i._id, defaultRatio: 1 }));

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card/50 py-0 shadow-sm transition-shadow hover:shadow-md dark:border-border/40 dark:bg-card/30">
      <div className="flex items-center justify-between gap-3 border-b border-border/50 bg-muted/30 px-4 py-2 dark:bg-muted/20">
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-medium text-primary text-xs dark:bg-primary/20">
          {tMeal("ingredientIndex", { index: index + 1 })}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="h-8 w-8 shrink-0 rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          aria-label="Remove Ingredient"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 px-4 py-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <IngredientSelector
          index={index}
          control={control}
          availableIngredients={availableIngredients}
          setValue={setValue}
          selectedIngredientId={ingredientDefId}
        />
        <IngredientBasicFields index={index} control={control} />
      </div>

      <IngredientReplacementsField
        key={ingredientDefId ?? index}
        index={index}
        control={control}
        replacementOptions={replacementOptions}
        hasDefaultReplacements={hasReplacements}
      />
    </div>
  );
});
