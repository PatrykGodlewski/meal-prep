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
  control: Control<any>;
}

export function MealFormDetails({ control }: MealFormDetailsProps) {
  const t = useTranslations("mealEditor");
  const tMeal = useTranslations("meal");

  return (
    <div className="p-6 space-y-8">
      {/* Title */}
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs font-medium sr-only">
              {t("mealNameLabel")}
            </FormLabel>
            <FormControl>
              <Input
                type="text"
                {...field}
                className="text-3xl font-bold h-auto py-2 bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-600"
                aria-label={t("mealNameLabel")}
                placeholder={t("mealNamePlaceholder")}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Meta Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 items-end">
        <FormField
          control={control}
          name="prepTimeMinutes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm flex items-center gap-1">
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
              <FormLabel className="text-sm flex items-center gap-1">
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
              <FormLabel className="text-sm flex items-center gap-1">
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
            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 shadow-xs h-10">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  id="isPublicEdit"
                />
              </FormControl>
              <FormLabel htmlFor="isPublicEdit" className="text-sm font-normal">
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
            <FormLabel className="text-lg font-semibold">
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
