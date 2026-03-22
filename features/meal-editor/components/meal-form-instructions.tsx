"use client";
import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

interface MealFormInstructionsProps {
  // biome-ignore lint/suspicious/noExplicitAny: react-hook-form Control requires form type; meal form type varies
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
          <FormLabel className="font-semibold text-lg">
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
