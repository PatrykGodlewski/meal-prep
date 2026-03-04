"use client";

import { useTranslations } from "next-intl";
import React from "react";
import type { Control } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INGREDIENT_CATEGORIES, UNITS } from "@/convex/schema";

interface IngredientBasicFieldsProps {
  index: number;
  control: Control<any>;
}

export const IngredientBasicFields = React.memo(function IngredientBasicFields({
  index,
  control,
}: IngredientBasicFieldsProps) {
  const t = useTranslations("ingredient");
  const tMeal = useTranslations("mealEditor");

  return (
    <div className="contents">
      <FormField
        control={control}
        name={`ingredients.${index}.quantity`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs">{tMeal("quantityLabel")}*</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="any"
                placeholder={tMeal("quantityPlaceholder")}
                className="h-10 rounded-lg"
                {...field}
                onChange={(e) => field.onChange(e.target.valueAsNumber)}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={`ingredients.${index}.unit`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs">{tMeal("unitLabel")}</FormLabel>
            <Select value={field.value ?? "g"} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="h-10 rounded-lg">
                  <SelectValue placeholder={t("unit")} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {UNITS.map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {t(unit)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={`ingredients.${index}.category`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs">{tMeal("categoryLabel")}</FormLabel>
            <Select value={field.value ?? "other"} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="h-10 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {INGREDIENT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat} className="capitalize">
                    {t(cat)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={`ingredients.${index}.notes`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs">{tMeal("notesLabel")}</FormLabel>
            <FormControl>
              <Input
                className="h-10 rounded-lg"
                {...field}
                value={field.value ?? ""}
                placeholder={tMeal("notesPlaceholder")}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={`ingredients.${index}.isOptional`}
        render={({ field }) => (
          <FormItem className="flex flex-row items-center space-x-2 self-end pt-1">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                id={`ing-opt-${index}`}
              />
            </FormControl>
            <Label htmlFor={`ing-opt-${index}`} className="font-normal text-xs">
              {tMeal("optionalLabel")}
            </Label>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={`ingredients.${index}.calories`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs">{tMeal("caloriesPerUnitLabel")}</FormLabel>
            <FormControl>
              <Input
                type="number"
                className="h-10 rounded-lg"
                placeholder={tMeal("caloriesPerUnitPlaceholder")}
                {...field}
                value={field.value ?? ""}
                onChange={(e) =>
                  field.onChange(
                    e.target.value === "" ? null : Number.parseInt(e.target.value),
                  )
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
});
