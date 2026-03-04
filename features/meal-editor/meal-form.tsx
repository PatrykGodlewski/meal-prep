"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import type { FunctionReturnType } from "convex/server";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Form } from "@/components/ui/form";
import type { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import {
  type MutationMealAddValues,
  type MutationMealEditValues,
  mutationMealAddSchema,
  mutationMealEditSchema,
} from "@/convex/meals/validators";
import { MealFormActions } from "./components/meal-form-actions";
import { MealFormDetails } from "./components/meal-form-details";
import { MealFormImage } from "./components/meal-form-image";
import { MealFormIngredients } from "./components/meal-form-ingredients";
import { MealFormInstructions } from "./components/meal-form-instructions";
import { useMealEditor } from "./store";
import type { Meal } from "./types";

/**
 * Maps a meal query result to form values for editing.
 * @param meal The meal data fetched from the query.
 * @returns The meal data formatted for the form.
 */
const mapMealToFormValues = (
  meal: FunctionReturnType<typeof api.meals.queries.getMeal>,
): MutationMealEditValues | undefined => {
  if (!meal) return undefined;

  const { mealIngredients, ...mealData } = meal;

  const formIngredients =
    mealIngredients?.map(
      (mi): MutationMealEditValues["ingredients"][number] => ({
        ingredientId: mi.ingredient?._id,
        name: mi.ingredient?.name ?? "",
        calories: mi.ingredient?.calories ?? 0,
        category: mi.ingredient?.category ?? "other",
        unit: mi.ingredient?.unit ?? "g",
        quantity: mi.quantity,
        isOptional: mi.isOptional ?? false,
        notes: mi.notes ?? "",
        allowedReplacements:
          ((mi as { allowedReplacements?: { ingredientId: string; ratio?: number }[] })
            .allowedReplacements ??
          (mi as { allowedReplacementIds?: string[] }).allowedReplacementIds?.map(
            (id) => ({ ingredientId: id, ratio: 1 }),
          )) as MutationMealEditValues["ingredients"][number]["allowedReplacements"],
      }),
    ) ?? [];

  return {
    mealId: mealData._id,
    ...mealData,
    description: mealData.description ?? "",
    prepTimeMinutes: mealData.prepTimeMinutes ?? undefined,
    cookTimeMinutes: mealData.cookTimeMinutes ?? undefined,
    categories: mealData.categories ?? [],
    calories: mealData.calories ?? 0,
    imageUrl: mealData.imageUrl ?? "",
    instructions: mealData.instructions ?? "",
    isPublic: mealData.isPublic ?? false,
    ingredients: formIngredients,
  };
};

interface MealFormProps {
  meal?: Meal;
  availableIngredients: Doc<"ingredients">[];
  onSuccess?: () => void;
}

/**
 * A form for creating and editing meals.
 * It uses a custom hook `useMealEditor` to handle the mutations.
 *
 * @param {MealFormProps} props The component props.
 * @param {Meal} props.meal The meal to edit. If not provided, the form is in "add" mode.
 * @param {Doc<"ingredients">[]} props.availableIngredients The list of available ingredients.
 * @param {() => void} props.onSuccess A callback to execute on success.
 * @returns {JSX.Element} The `MealForm` component.
 */
export function MealForm({
  availableIngredients = [],
  meal,
  onSuccess,
}: MealFormProps) {
  const t = useTranslations("mealEditor");
  const router = useRouter();

  const { isPending, editMeal, deleteMeal, addMeal } = useMealEditor({
    onSuccess: (mealId) => {
      if (mealId) router.push(`/meals/${mealId}`);
      if (onSuccess) onSuccess();
    },
  });

  const form = useForm({
    resolver: zodResolver(
      meal ? mutationMealEditSchema : mutationMealAddSchema,
    ),
    defaultValues: meal
      ? mapMealToFormValues(meal)
      : {
          name: "",
          description: "",
          categories: [],
          calories: 0,
          imageUrl: "",
          instructions: "",
          isPublic: false,
          ingredients: [],
        },
  });

  const onSubmit = (values: MutationMealEditValues | MutationMealAddValues) => {
    if (meal) {
      editMeal(values as MutationMealEditValues);
    } else {
      addMeal(values as MutationMealAddValues);
    }
  };

  const handleDeleteConfirm = () => {
    if (!meal?._id) {
      toast(t("toastErrorTitle"), {
        description: t("toastDeleteErrorMissingId"),
      });
      return;
    }
    deleteMeal({ mealId: meal._id });
  };

  const isEditMode = !!meal;

  return (
    <>
      <MealFormActions
        isEditMode={isEditMode}
        isPending={isPending}
        isDirty={form.formState.isDirty}
        onSubmit={form.handleSubmit(onSubmit)}
        onDelete={handleDeleteConfirm}
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="overflow-hidden rounded-lg bg-white shadow-md dark:bg-neutral-900">
            <MealFormImage control={form.control} setValue={form.setValue} />
            <div className="space-y-8 p-6">
              <MealFormDetails control={form.control} />
              <MealFormIngredients
                control={form.control}
                availableIngredients={availableIngredients}
                setValue={form.setValue}
                errors={form.formState.errors}
              />
              <MealFormInstructions control={form.control} />
            </div>
          </div>
        </form>
      </Form>
    </>
  );
}
