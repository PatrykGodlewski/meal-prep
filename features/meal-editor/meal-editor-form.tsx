// components/meal-edit-form.tsx
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Doc } from "@/convex/_generated/dataModel";
import { Clock, Plus, Save, Trash2, Users } from "lucide-react"; // Added icons
import { useFieldArray, useForm } from "react-hook-form";
import {
  type IngredientFormValues,
  MealAddFormValues,
  MealUpdateFormSchema,
  type MealUpdateFormValues,
} from "./schema";
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

const mapPageDataToFormValues = (
  meal: FunctionReturnType<typeof api.meals.getMeal>,
): MealUpdateFormValues | undefined => {
  if (!meal) return undefined; // Return undefined if no data

  const { mealIngredients, ...mealData } = meal; // Separate meal base data

  const formIngredients = (mealIngredients || []) // Handle potentially undefined mealIngredients
    .filter((mi) => mi.ingredient !== null) // Process only valid links
    .map((mi) => {
      const ingredient = mi.ingredient!; // Safe due to filter
      return {
        id: ingredient._id, // Ingredient definition ID
        name: ingredient.name,
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
    description: mealData.description,
    prepTimeMinutes: mealData.prepTimeMinutes ?? undefined,
    cookTimeMinutes: mealData.cookTimeMinutes ?? undefined,
    servings: mealData.servings ?? undefined,
    category: mealData.category ?? "lunch",
    imageUrl: mealData.imageUrl ?? "",
    instructions: mealData.instructions ?? "",
    isPublic: mealData.isPublic ?? false,
    ingredients: formIngredients,
  };
};

const NEW_INGREDIENT_DEFAULT: IngredientFormValues = {
  name: "",
  quantity: 0,
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
  const { isPending, editMeal, deleteMeal } = useMealEditor({
    onSuccess,
  });

  const form = useForm({
    resolver: zodResolver(MealUpdateFormSchema),
    defaultValues: mapPageDataToFormValues(meal),
  });

  const { control, setValue } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "ingredients",
  });

  const onSubmitEdit = (values: MealUpdateFormValues) => {
    if (!meal?._id) return;
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    editMeal(values as any);
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
        title: "Error",
        description: "Cannot delete meal: ID missing.",
        variant: "destructive",
      });
      return;
    }
    deleteMeal({ mealId: meal._id });
  };

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
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={isPending}>
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-red-600 hover:bg-red-700"
                disabled={isPending}
              >
                {isPending ? "Deleting..." : "Delete"}
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
                    Image URL
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
                            placeholder="https://example.com/image.jpg"
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
                      Meal Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        {...field}
                        className="text-3xl font-bold h-auto py-2 bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-600"
                        aria-label="Meal Name"
                        placeholder="Meal Name*"
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
                        <Clock className="h-4 w-4" /> Prep Time (min)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="15"
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
                        <Clock className="h-4 w-4" /> Cook Time (min)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="30"
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
                        <Users className="h-4 w-4" /> Servings
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="4"
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
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Meal Category</FormLabel>
                      <Select
                        value={field.value ?? ""}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Meal" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {MEAL_CATEGORIES.map((cat) => (
                            <SelectItem
                              key={cat}
                              value={cat}
                              className="capitalize"
                            >
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="isPublic"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 shadow-sm h-10">
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
                        Make Public
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
                      Description*
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        className="min-h-24"
                        placeholder="Brief description of the meal..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* --- Ingredients Section (MODIFIED) --- */}
              <div className="space-y-6 border-t pt-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Ingredients*</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddIngredient}
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" /> Add Ingredient
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
                      Instructions
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value ?? ""}
                        className="min-h-40"
                        placeholder="Step-by-step instructions..."
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
