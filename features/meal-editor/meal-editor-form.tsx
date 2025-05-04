"use client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Doc } from "@/convex/_generated/dataModel";
import { Clock, Plus, Save, Trash2, Users, Weight } from "lucide-react"; // Added icons
import { useFieldArray, useForm } from "react-hook-form";
import type { IngredientFormValues } from "./schema";
import { MEAL_CATEGORIES } from "@/convex/schema";
import type { Meal } from "./types";
import type { api } from "@/convex/_generated/api";
import { toast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import type { FunctionReturnType } from "convex/server";
import { IngredientInputRow } from "./ingredient-input-row";
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
import { useMealEditor } from "./store";
import { useTranslations } from "next-intl";
import {
  mutationMealEditSchema,
  type MutationMealEditValues,
} from "@/convex/meals/validators";
import { MultiSelect } from "@/components/multi-select";

const mapPreloadedDataToFormValues = (
  meal: FunctionReturnType<typeof api.meals.queries.getMeal>,
): MutationMealEditValues | undefined => {
  if (!meal) return undefined; // Return undefined if no data

  const { mealIngredients, ...mealData } = meal; // Separate meal base data

  const formIngredients = (mealIngredients || []) // Handle potentially undefined mealIngredients
    .filter((mi) => mi.ingredient !== null) // Process only valid links
    .map((mi): MutationMealEditValues["ingredients"][number] => {
      const ingredient = mi.ingredient!; // Safe due to filter
      return {
        ingredientId: ingredient._id, // Ingredient definition ID
        name: ingredient.name,
        calories: ingredient.calories ?? 0,
        category: ingredient.category ?? "other",
        unit: ingredient.unit ?? "g",
        quantity: mi.quantity, // From junction record
        isOptional: mi.isOptional ?? false, // From junction record
        notes: mi.notes ?? "", // From junction record
      };
    });

  // Map the main meal data
  return {
    mealId: mealData._id,
    name: mealData.name,
    description: mealData.description ?? "",
    prepTimeMinutes: mealData.prepTimeMinutes ?? undefined,
    cookTimeMinutes: mealData.cookTimeMinutes ?? undefined,
    servings: mealData.servings ?? undefined,
    categories: mealData.categories ?? [],
    calories: mealData.calories ?? 0,
    imageUrl: mealData.imageUrl ?? "",
    instructions: mealData.instructions ?? "",
    isPublic: mealData.isPublic ?? false,
    ingredients: formIngredients,
  };
};

const NEW_INGREDIENT_DEFAULT: IngredientFormValues = {
  name: "",
  quantity: 0,
  calories: 0,
  unit: "g",
  category: "other",
  isOptional: false,
  notes: undefined,
};

interface MealEditFormProps {
  meal: Meal;
  availableIngredients: Doc<"ingredients">[];
  onSuccess?: () => void;
}

export function MealEditForm({
  availableIngredients = [],
  meal,
  onSuccess,
}: MealEditFormProps) {
  const t = useTranslations("mealEditor");
  const tMeal = useTranslations("meal");

  const { isPending, editMeal, deleteMeal } = useMealEditor({
    onSuccess,
  });

  const form = useForm({
    resolver: zodResolver(mutationMealEditSchema),
    defaultValues: mapPreloadedDataToFormValues(meal),
  });

  const { control, setValue } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "ingredients",
  });

  const onSubmitEdit = (values: MutationMealEditValues) => {
    if (!meal?._id) return;
    editMeal(values);
  };

  const handleAddIngredient = () => {
    append(NEW_INGREDIENT_DEFAULT); // Append a new ingredient with default values
  };

  const handleRemoveIngredient = (index: number) => {
    remove(index);
  };

  const handleDeleteConfirm = () => {
    if (!meal?._id) {
      toast({
        title: t("toastErrorTitle"),
        description: t("toastDeleteErrorMissingId"),
        variant: "destructive",
      });
      return;
    }
    deleteMeal({ mealId: meal._id });
  };

  // Note: Cannot use the hook 't' here as it's outside the main component body return.
  // If this loading state needs translation, consider a different approach,
  // maybe rendering a small component that uses the hook.
  // For now, leaving it as is or using a simple placeholder.
  if (!meal) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        Loading meal data...
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-2">
        <Button
          onClick={form.handleSubmit(onSubmitEdit)}
          disabled={isPending || !form.formState.isDirty}
        >
          <Save className="h-4 w-4 mr-1" />{" "}
          {isPending ? t("saving") : t("saveChanges")}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={isPending}>
              <Trash2 className="h-4 w-4 mr-1" /> {t("delete")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("deleteConfirmationTitle")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t("deleteConfirmationDescription")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>
                {t("cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-red-600 hover:bg-red-700"
                disabled={isPending}
              >
                {isPending ? t("deleting") : t("delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmitEdit)} className="space-y-8">
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-md overflow-hidden">
            {/* Image Section */}
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

            {/* Details Section */}
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
                  name="servings"
                  render={({ field }) => (
                    <FormItem>
                      {" "}
                      <FormLabel className="text-sm flex items-center gap-1">
                        <Users className="h-4 w-4" /> {t("servingsLabel")}
                      </FormLabel>
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
                      <FormLabel
                        htmlFor="isPublicEdit"
                        className="text-sm font-normal"
                      >
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

              {/* --- Ingredients Section (MODIFIED) --- */}
              <div className="space-y-6 border-t pt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">
                    {t("ingredientsTitle")}
                  </h3>
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
                      setValue={setValue}
                      field={field}
                    />
                  ))}
                </div>
              </div>
              {/* --- End Ingredients Section --- */}

              {/* Instructions Section */}
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
            </div>
          </div>
        </form>
      </Form>
    </>
  );
}
