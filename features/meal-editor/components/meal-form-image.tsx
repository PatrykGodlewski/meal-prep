"use client";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";

interface MealFormImageProps {
  control: Control<any>;
}

export function MealFormImage({ control }: MealFormImageProps) {
  const t = useTranslations("mealEditor");

  return (
    <div className="relative h-64 md:h-96 w-full bg-gray-200 dark:bg-neutral-800">
      <div className="absolute inset-0 flex items-center justify-center p-4 bg-black bg-opacity-60">
        <div className="w-full max-w-md space-y-2">
          <Label htmlFor="imageUrlEdit" className="text-white">
            {t("imageUrlLabel")}
          </Label>
          <FormField
            control={control}
            name="imageUrl"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    id="imageUrlEdit"
                    type="text"
                    placeholder={t("imageUrlPlaceholder")}
                    {...field}
                    value={field.value ?? ""}
                    className="bg-white dark:bg-neutral-700 border-gray-300 dark:border-neutral-600"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}
