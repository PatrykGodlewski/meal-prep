"use client";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form";
import type { Doc } from "@/convex/_generated/dataModel";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Control, FieldErrors, UseFormSetValue } from "react-hook-form";
import { useFieldArray } from "react-hook-form";
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
  control: Control<any>;
  availableIngredients: Doc<"ingredients">[];
  setValue: UseFormSetValue<any>;
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
    <div className="space-y-6 border-t pt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">{t("ingredientsTitle")}</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddIngredient}
          className="flex items-center gap-1"
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
