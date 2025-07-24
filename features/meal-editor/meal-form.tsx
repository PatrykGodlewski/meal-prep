"use client";
import { Form } from "@/components/ui/form";
import type { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import {
  type MutationMealAddValues,
  type MutationMealEditValues,
  mutationMealAddSchema,
  mutationMealEditSchema,
} from "@/convex/meals/validators";
import { zodResolver } from "@hookform/resolvers/zod";
import type { FunctionReturnType } from "convex/server";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { MealFormActions } from "./components/meal-form-actions";
import { MealFormDetails } from "./components/meal-form-details";
import { MealFormImage } from "./components/meal-form-image";
import { MealFormIngredients } from "./components/meal-form-ingredients";
import { MealFormInstructions } from "./components/meal-form-instructions";
import { useMealEditor } from "./store";
import type { Meal } from "./types";

const mapPreloadedDataToFormValues = (
  meal: FunctionReturnType<typeof api.meals.queries.getMeal>,
): MutationMealEditValues | undefined => {
  if (!meal) return undefined;

  const { mealIngredients, ...mealData } = meal; // Separate meal base data

  const formIngredients = (mealIngredients || []) // Handle potentially undefined mealIngredients
    .map((mi): MutationMealEditValues["ingredients"][number] => {
      const ingredient = mi.ingredient; // Safe due to filter
      return {
        ingredientId: ingredient?._id, // Ingredient definition ID
        name: ingredient?.name ?? "_TODO_should_be_empty_name_TODO_",
        calories: ingredient?.calories ?? 0,
        category: ingredient?.category ?? "other",
        unit: ingredient?.unit ?? "g",
        quantity: mi.quantity, // From junction record
        isOptional: mi.isOptional ?? false, // From junction record
        notes: mi.notes ?? "", // From junction record
      };
    });

  return {
    mealId: mealData._id,
    name: mealData.name,
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
      ? mapPreloadedDataToFormValues(meal)
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
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-md overflow-hidden">
            <MealFormImage control={form.control} />
            <div className="p-6 space-y-8">
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
