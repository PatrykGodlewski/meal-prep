// components/meal-edit-form.tsx
"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import * as z from "zod";
import { Clock, Plus, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"; // Use RHF Form
import { Card } from "@/components/ui/card"; // Use Card from shadcn
import { ingredientCategories, mealCategories, unitTypes } from "@/validators";
import {
  INGREDIENT_CATEGORY_ENUM,
  MEAL_CATEGORY_ENUM,
  UNIT_ENUM,
} from "@/supabase/schema";

const IngredientFormSchema = z.object({
  id: z.string().uuid().optional(),
  mealId: z.string().uuid().optional(),
  name: z.string().min(1, "Ingredient name is required"),
  quantity: z.string().min(1, "Quantity is required"),
  unit: unitTypes.nullable().optional(),
  category: ingredientCategories.nullable().optional(),
  isOptional: z.boolean().default(false),
  notes: z.string().nullable().optional(),
});

export const MealFormSchema = z.object({
  // Export if needed elsewhere, or keep local
  id: z.string().uuid(),
  name: z.string().min(2, "Meal name must be at least 2 characters."),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters."),
  instructions: z.string().nullable().optional(),
  prepTimeMinutes: z.coerce.number().int().positive().nullable().optional(),
  cookTimeMinutes: z.coerce.number().int().positive().nullable().optional(),
  servings: z.coerce.number().int().positive().nullable().optional(),
  category: mealCategories.nullable().optional(),
  imageUrl: z
    .string()
    .url("Invalid URL")
    .or(z.literal(""))
    .nullable()
    .optional(),
  isPublic: z.boolean().default(false),
  ingredients: z
    .array(IngredientFormSchema)
    .min(1, "At least one ingredient is required."),
});

export type MealUpdateFormValues = z.infer<typeof MealFormSchema>;

// --- Default values for a *new* ingredient row ---
const NEW_INGREDIENT_DEFAULT = {
  // id: crypto.randomUUID(), // RHF provides a stable ID via field.id
  name: "",
  quantity: "",
  unit: null,
  category: null,
  isOptional: false,
  notes: "",
};

export function MealEditForm() {
  const form = useFormContext<MealUpdateFormValues>();
  const { control } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "ingredients",
  });

  const handleAddIngredient = () => {
    append(NEW_INGREDIENT_DEFAULT);
  };

  const handleRemoveIngredient = (index: number) => {
    remove(index);
  };

  return (
    // The <form> tag is rendered by the parent component using form.handleSubmit
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
                  {" "}
                  {/* Wrap input in FormItem for message */}
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
              </FormLabel>{" "}
              {/* Hide label visually if needed */}
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
                    {MEAL_CATEGORY_ENUM.enumValues.map((cat) => (
                      <SelectItem key={cat} value={cat} className="capitalize">
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

        {/* Ingredients Section */}
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
            {fields.map(
              (
                field,
                index, // `field` here is from useFieldArray
              ) => (
                <Card
                  key={field.id}
                  className="p-4 bg-gray-50 dark:bg-neutral-800/50 border dark:border-neutral-700"
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-medium text-sm text-gray-700 dark:text-gray-300">
                      Ingredient #{index + 1}
                    </span>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveIngredient(index)}
                        className="h-6 w-6 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50"
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FormField
                      control={control}
                      name={`ingredients.${index}.name`}
                      render={({ field: inputField }) => (
                        <FormItem className="sm:col-span-2 lg:col-span-1">
                          <FormLabel className="text-xs">Name*</FormLabel>
                          <FormControl>
                            <Input {...inputField} placeholder="e.g., Flour" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name={`ingredients.${index}.quantity`}
                      render={({ field: inputField }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Quantity*</FormLabel>
                          <FormControl>
                            <Input {...inputField} placeholder="e.g., 2" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name={`ingredients.${index}.unit`}
                      render={({ field: inputField }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Unit</FormLabel>
                          <Select
                            value={inputField.value ?? ""}
                            onValueChange={inputField.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {UNIT_ENUM.enumValues.map((unit) => (
                                <SelectItem key={unit} value={unit}>
                                  {unit}
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
                      name={`ingredients.${index}.category`}
                      render={({ field: inputField }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Category</FormLabel>
                          <Select
                            value={inputField.value ?? ""}
                            onValueChange={inputField.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {INGREDIENT_CATEGORY_ENUM.enumValues.map(
                                (category) => (
                                  <SelectItem
                                    key={category}
                                    value={category}
                                    className="capitalize"
                                  >
                                    {category.replace(/_/g, " ")}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name={`ingredients.${index}.notes`}
                      render={({ field: inputField }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Notes</FormLabel>
                          <FormControl>
                            <Input
                              {...inputField}
                              value={inputField.value ?? ""}
                              placeholder="e.g., finely chopped"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name={`ingredients.${index}.isOptional`}
                      render={({ field: inputField }) => (
                        <FormItem className="flex flex-row items-center space-x-2 pt-5">
                          <FormControl>
                            <Checkbox
                              checked={inputField.value}
                              onCheckedChange={inputField.onChange}
                              id={`ing-opt-${index}`}
                            />
                          </FormControl>
                          <Label
                            htmlFor={`ing-opt-${index}`}
                            className="text-xs font-normal"
                          >
                            Optional
                          </Label>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </Card>
              ),
            )}
          </div>
        </div>

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
  );
}
MealEditForm.displayName = "MealEditForm";
