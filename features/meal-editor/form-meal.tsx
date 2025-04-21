"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
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
import { INGREDIENT_CATEGORIES, MEAL_CATEGORIES, UNITS } from "@/convex/schema";
import { MealAddFormSchema, type MealAddFormValues } from "./schema";
import { IngredientInputRow } from "./ingredient-input-row";
import { useMealEditor } from "./store";

const NEW_INGREDIENT_DEFAULT = {
  id: undefined,
  name: "",
  quantity: 0,
  unit: UNITS[0],
  category: INGREDIENT_CATEGORIES[0],
  isOptional: false,
  notes: "",
};

const DEFAULT_ADD_VALUES = {
  name: "",
  description: "",
  instructions: "",
  prepTimeMinutes: 0,
  cookTimeMinutes: 0,
  servings: 0,
  category: MEAL_CATEGORIES[1],
  imageUrl: "",
  isPublic: false,
  ingredients: [NEW_INGREDIENT_DEFAULT],
};

type Props = {
  preloadedIngredients: Preloaded<typeof api.ingredients.getIngredients>;
};

export default function AddMealForm({ preloadedIngredients }: Props) {
  const availableIngredients = usePreloadedQuery(preloadedIngredients);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(MealAddFormSchema),
    defaultValues: DEFAULT_ADD_VALUES,
  });
  const { control, setValue } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "ingredients",
  });

  const { addMeal } = useMealEditor({
    onSuccess: (mealId) => {
      if (mealId) router.push(`/meals/${mealId}`);
    },
  });

  const onSubmit = (values: MealAddFormValues) => {
    startTransition(() => {
      addMeal(values);
    });
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
          {/* Meal Name and Category */}
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
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meal Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a meal category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MEAL_CATEGORIES.map((category) => (
                        <SelectItem
                          key={category}
                          value={category}
                          className="capitalize"
                        >
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
