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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
      <h1 className="text-2xl font-bold mb-6">Add New Meal</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meal Name*</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter meal name" {...field} />
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
                  <FormLabel>Categories</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={MEAL_CATEGORIES.map((cat) => ({
                        label: cat,
                        value: cat,
                      }))}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      placeholder="Select category"
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
                <FormLabel>Description*</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Brief description of the meal"
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
                <FormLabel>Instructions</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Step-by-step instructions..."
                    className="min-h-32"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormDescription>
                  Provide detailed steps for preparing the meal.
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
                  <FormLabel>Prep Time (min)</FormLabel>
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
                  <FormLabel>Cook Time (min)</FormLabel>
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
                  <FormLabel>Servings</FormLabel>
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
              name="calories"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Calories</FormLabel>
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
          </div>

          {/* Image URL */}
          <FormField
            control={control}
            name="imageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Image URL</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://example.com/image.jpg"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormDescription>
                  Provide a URL to an image of the meal.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Is Public */}
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
                    Make this meal public
                  </FormLabel>
                  <FormDescription>
                    Public meals can be viewed by other users.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {/* --- Ingredients Section --- */}
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
                  field={field}
                  setValue={setValue}
                />
              ))}
            </div>
          </div>
          {/* --- End Ingredients Section --- */}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Adding Meal..." : "Add Meal"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
