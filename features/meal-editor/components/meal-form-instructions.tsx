"use client";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";

interface MealFormInstructionsProps {
  control: Control<any>;
}

export function MealFormInstructions({ control }: MealFormInstructionsProps) {
  const t = useTranslations("mealEditor");

  return (
    <FormField
      control={control}
      name="instructions"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-lg font-semibold">
            {t("instructionsLabel")}
          </FormLabel>
          <FormControl>
            <Textarea
              {...field}
              value={field.value ?? ""}
              className="min-h-40"
              placeholder={t("instructionsPlaceholder")}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
