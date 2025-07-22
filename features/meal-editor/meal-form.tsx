"use client";

import { BackButton } from "@/components/back-button";
import { MultiSelect } from "@/components/multi-select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import type { MutationMealIngredientValues } from "@/convex/ingredients/validators";
import {
  type MutationMealAddValues,
  mutationMealAddSchema,
} from "@/convex/meals/validators";
import {
  DEFAULT_INGREDIENT_CATEGORY,
  MEAL_CATEGORIES,
  UNITS,
} from "@/convex/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Preloaded } from "convex/react";
import { usePreloadedQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Clock, Plus, Save, Trash2, Weight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { IngredientInputRow } from "./ingredient-input-row";
import { useMealEditor } from "./store";
import type { Meal } from "./types";

type Props = {
  preloadedIngredients: Preloaded<
    typeof api.ingredients.queries.getIngredients
  >;
  meal?: Meal;
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

const mapPreloadedDataToFormValues = (
  meal?: FunctionReturnType<typeof api.meals.queries.getMeal>,
): MutationMealAddValues | undefined => {
  if (!meal) return undefined;

  const { mealIngredients, ...mealData } = meal;

  const formIngredients = (mealIngredients || [])
    .map((mi): MutationMealIngredientValues => {
      const ingredient = mi.ingredient;
      return {
        ingredientId: ingredient?._id,
        name: ingredient?.name ?? "_TODO_should_be_empty_name_TODO_",
        calories: ingredient?.calories ?? 0,
        category: ingredient?.category ?? "other",
        unit: ingredient?.unit ?? "g",
        quantity: mi.quantity,
        isOptional: mi.isOptional ?? false,
        notes: mi.notes ?? "",
      };
    });

  return {
    name: mealData.name,
    description: mealData.description ?? "",
    prepTimeMinutes: mealData.prepTimeMinutes,
    cookTimeMinutes: mealData.cookTimeMinutes,
    categories: mealData.categories ?? [],
    calories: mealData.calories ?? 0,
    imageUrl: mealData.imageUrl ?? "",
    instructions: mealData.instructions ?? "",
    isPublic: mealData.isPublic ?? false,
    ingredients: formIngredients,
  };
};

export default function MealForm({ preloadedIngredients, meal }: Props) {
  const availableIngredients = usePreloadedQuery(preloadedIngredients);
  const router = useRouter();
  const t = useTranslations("addMealForm");
  const tMeal = useTranslations("meal");
  const tEditor = useTranslations("mealEditor");

  const form = useForm({
    resolver: zodResolver(mutationMealAddSchema),
    defaultValues: mapPreloadedDataToFormValues(meal),
  });

  const { control, setValue } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "ingredients",
  });

  const { addMeal, editMeal, deleteMeal, isPending } = useMealEditor({
    onSuccess: (mealId) => {
      if (mealId) router.push(`/meals/${mealId}`);
    },
  });

  const onSubmit = (values: MutationMealAddValues) => {
    if (meal) {
      editMeal({ ...values, mealId: meal._id });
    } else {
      addMeal(values);
    }
  };

  const handleAddIngredient = () => {
    append(NEW_INGREDIENT_DEFAULT);
  };

  const handleRemoveIngredient = (index: number) => {
    remove(index);
  };

  const handleDeleteConfirm = () => {
    if (!meal?._id) {
      toast(tEditor("toastErrorTitle"), {
        description: tEditor("toastDeleteErrorMissingId"),
      });
      return;
    }
    deleteMeal({ mealId: meal._id });
  };

  const isEditMode = !!meal;

  return (
    <div className="max-w-4xl space-y-4 mx-auto p-4 md:p-6">
      <BackButton />
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold mb-6">
          {isEditMode ? tEditor("editMealTitle") : t("addNewMealTitle")}
        </h1>
        {isEditMode && (
          <div className="flex gap-2">
            <Button
              onClick={form.handleSubmit(onSubmit)}
              disabled={isPending || !form.formState.isDirty}
            >
              <Save className="h-4 w-4 mr-1" />
              {isPending ? tEditor("saving") : tEditor("saveChanges")}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isPending}>
                  <Trash2 className="h-4 w-4 mr-1" /> {tEditor("delete")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {tEditor("deleteConfirmationTitle")}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {tEditor("deleteConfirmationDescription")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isPending}>
                    {tEditor("cancel")}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteConfirm}
                    className="bg-red-600 hover:bg-red-700"
                    disabled={isPending}
                  >
                    {isPending ? tEditor("deleting") : tEditor("delete")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
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
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow-xs">
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

          {!isEditMode && (
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? t("addingMealButtonLoading") : t("addMealButton")}
            </Button>
          )}
        </form>
      </Form>
    </div>
  );
}
