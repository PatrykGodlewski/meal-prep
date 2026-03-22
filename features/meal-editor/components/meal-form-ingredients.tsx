"use client";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Control, FieldErrors, UseFormSetValue } from "react-hook-form";
import { useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form";
import type { Doc } from "@/convex/_generated/dataModel";
import { IngredientInputRow } from "../ingredient-input-row";
import type { IngredientFormValues } from "../schema";

const NEW_INGREDIENT_DEFAULT: IngredientFormValues = {
  name: "",
  quantity: 0,
  calories: 0,
  unit: "g",
  category: "other",
  isOptional: false,
  notes: undefined,
};

interface MealFormIngredientsProps {
  // biome-ignore lint/suspicious/noExplicitAny: react-hook-form Control requires form type; meal form type varies
  control: Control<any>;
  availableIngredients: Doc<"ingredients">[];
  // biome-ignore lint/suspicious/noExplicitAny: react-hook-form setValue requires form type
  setValue: UseFormSetValue<any>;
  // biome-ignore lint/suspicious/noExplicitAny: react-hook-form FieldErrors requires form type
  errors: FieldErrors<any>;
}

export function MealFormIngredients({
  control,
  availableIngredients,
  setValue,
  errors,
}: MealFormIngredientsProps) {
  const t = useTranslations("mealEditor");

  const { fields, append, remove } = useFieldArray({
    control,
    name: "ingredients",
  });

  const handleAddIngredient = () => {
    append(NEW_INGREDIENT_DEFAULT);
  };

  const handleRemoveIngredient = (index: number) => {
    remove(index);
  };

  return (
    <div className="space-y-6 border-border/60 border-t pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold text-xl tracking-tight">
          {t("ingredientsTitle")}
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddIngredient}
          className="flex gap-1.5 rounded-lg border-primary/30 transition-colors hover:border-primary/50 hover:bg-primary/5"
        >
          <Plus className="h-4 w-4" /> {t("addIngredientButton")}
        </Button>
      </div>
      <FormMessage>{errors.ingredients?.root?.message as string}</FormMessage>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <IngredientInputRow
            key={field.id}
            index={index}
            control={control}
            availableIngredients={availableIngredients}
            onRemove={() => handleRemoveIngredient(index)}
            setValue={setValue}
            field={field}
          />
        ))}
      </div>
    </div>
  );
}
