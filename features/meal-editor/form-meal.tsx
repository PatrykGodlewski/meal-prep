"use client";

import {
  mutationMealAddSchema,
  type MutationMealAddValues,
} from "@/convex/meals/validators";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BackButton } from "@/components/back-button";
import { type Preloaded, usePreloadedQuery } from "convex/react";
import type { api } from "@/convex/_generated/api";
import {
  DEFAULT_INGREDIENT_CATEGORY,
  MEAL_CATEGORIES,
  UNITS,
} from "@/convex/schema";
import { IngredientInputRow } from "./ingredient-input-row";
import { useMealEditor } from "./store";
import type { MutationMealIngredientValues } from "@/convex/ingredients/validators";
import { MultiSelect } from "@/components/multi-select";
import { useTranslations } from "next-intl";

type Props = {
  preloadedIngredients: Preloaded<
    typeof api.ingredients.queries.getIngredients
  >;
};

const NEW_INGREDIENT_DEFAULT: MutationMealIngredientValues = {
  name: "",
  quantity: 1,
  calories: 0,
  category: DEFAULT_INGREDIENT_CATEGORY,
  isOptional: false,
  notes: "",
  unit: UNITS[0],
};

export default function AddMealForm({ preloadedIngredients }: Props) {
  const availableIngredients = usePreloadedQuery(preloadedIngredients);
  const router = useRouter();
  const t = useTranslations("addMealForm");
  const tMeal = useTranslations("meal");

  const form = useForm({
    resolver: zodResolver(mutationMealAddSchema),
  });

  const { control, setValue } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "ingredients",
  });

  const { addMeal, isPending } = useMealEditor({
    onSuccess: (mealId) => {
      if (mealId) router.push(`/meals/${mealId}`);
    },
  });

  const onSubmit = (values: MutationMealAddValues) => {
    addMeal(values);
  };

  const handleAddIngredient = () => {
    append(NEW_INGREDIENT_DEFAULT);
  };

  const handleRemoveIngredient = (index: number) => {
    remove(index);
  };

  return (
    <div className="max-w-4xl space-y-4 mx-auto p-4 md:p-6">
      <BackButton />
      <h1 className="text-2xl font-bold mb-6">{t("addNewMealTitle")}</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("mealNameLabel")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("mealNamePlaceholder")} {...field} />
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
          </div>

          {/* Description */}
          <FormField
            control={control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("descriptionLabel")}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t("descriptionPlaceholder")}
                    className="min-h-20"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Instructions */}
          <FormField
            control={control}
            name="instructions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("instructionsLabel")}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t("instructionsPlaceholder")}
                    className="min-h-32"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormDescription>
                  {t("instructionsDescription")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Prep Time, Cook Time, Servings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={control}
              name="prepTimeMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("prepTimeLabel")}</FormLabel>
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
                  <FormLabel>{t("cookTimeLabel")}</FormLabel>
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
              name="servings"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("servingsLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder={t("servingsPlaceholder")}
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
                  <FormLabel>{t("caloriesLabel")}</FormLabel>
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
          </div>

          <FormField
            control={control}
            name="imageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("imageUrlLabel")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("imageUrlPlaceholder")}
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormDescription>{t("imageUrlDescription")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="isPublic"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    id="isPublicCheckbox"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel htmlFor="isPublicCheckbox">
                    {t("makePublicLabel")}
                  </FormLabel>
                  <FormDescription>
                    {t("makePublicDescription")}
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

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
            <FormMessage>
              {form.formState.errors.ingredients?.root?.message}
            </FormMessage>

            <div className="space-y-4">
              {fields.map((field, index) => (
                <IngredientInputRow
                  key={field.id}
                  index={index}
                  control={control}
                  availableIngredients={availableIngredients}
                  onRemove={() => handleRemoveIngredient(index)}
                  field={field}
                  setValue={setValue}
                />
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? t("addingMealButtonLoading") : t("addMealButton")}
          </Button>
        </form>
      </Form>
    </div>
  );
}
