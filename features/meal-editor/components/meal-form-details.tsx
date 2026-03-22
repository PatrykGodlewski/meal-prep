"use client";
import { Clock, Weight } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import { MultiSelect } from "@/components/multi-select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MEAL_CATEGORIES } from "@/convex/schema";

interface MealFormDetailsProps {
  // biome-ignore lint/suspicious/noExplicitAny: react-hook-form Control requires form type; meal form type varies
  control: Control<any>;
}

export function MealFormDetails({ control }: MealFormDetailsProps) {
  const t = useTranslations("mealEditor");
  const tMeal = useTranslations("meal");

  return (
    <div className="space-y-8 p-6">
      {/* Title */}
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="sr-only font-medium text-xs">
              {t("mealNameLabel")}
            </FormLabel>
            <FormControl>
              <Input
                type="text"
                {...field}
                className="h-auto border-gray-300 bg-white py-2 font-bold text-3xl dark:border-neutral-600 dark:bg-neutral-800"
                aria-label={t("mealNameLabel")}
                placeholder={t("mealNamePlaceholder")}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Meta Info Grid */}
      <div className="grid grid-cols-1 items-end gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
        <FormField
          control={control}
          name="prepTimeMinutes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1 text-sm">
                <Clock className="h-4 w-4" /> {t("prepTimeLabel")}
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder={t("prepTimePlaceholder")}
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === ""
                        ? null
                        : Number.parseInt(e.target.value),
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="cookTimeMinutes"
          render={({ field }) => (
            <FormItem>
              {" "}
              <FormLabel className="flex items-center gap-1 text-sm">
                <Clock className="h-4 w-4" /> {t("cookTimeLabel")}
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder={t("cookTimePlaceholder")}
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === ""
                        ? null
                        : Number.parseInt(e.target.value),
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="calories"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1 text-sm">
                <Weight className="h-4 w-4" /> {t("caloriesLabel")}
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder={t("caloriesPlaceholder")}
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === ""
                        ? null
                        : Number.parseInt(e.target.value),
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="categories"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("categoriesLabel")}</FormLabel>
              <FormControl>
                <MultiSelect
                  options={MEAL_CATEGORIES.map((cat) => ({
                    label: tMeal(cat),
                    value: cat,
                  }))}
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  placeholder={t("categoriesPlaceholder")}
                  variant="inverted"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="isPublic"
          render={({ field }) => (
            <FormItem className="flex h-10 flex-row items-center space-x-3 space-y-0 rounded-md border p-3 shadow-xs">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  id="isPublicEdit"
                />
              </FormControl>
              <FormLabel htmlFor="isPublicEdit" className="font-normal text-sm">
                {t("makePublicLabel")}
              </FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Description */}
      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-semibold text-lg">
              {t("descriptionLabel")}
            </FormLabel>
            <FormControl>
              <Textarea
                {...field}
                className="min-h-24"
                placeholder={t("descriptionPlaceholder")}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
