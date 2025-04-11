"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, X } from "lucide-react";
import { useTransition } from "react";
import { useRouter } from "next/navigation"; // Added missing import

import { Button } from "@/components/ui/button";
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
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast"; // Ensure path is correct
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { addMealAction } from "@/app/actions"; // Ensure path is correct
import { ingredientCategories, mealCategories, unitTypes } from "@/validators";
import {
  INGREDIENT_CATEGORY_ENUM,
  MEAL_CATEGORY_ENUM,
  UNIT_ENUM,
} from "@/supabase/schema";

// Define Zod enums

// --- Updated Zod Schema ---
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Meal name must be at least 2 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  instructions: z.string().optional(),
  prepTimeMinutes: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .nullable()
    .transform((val) => (val === null ? undefined : val)),
  cookTimeMinutes: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .nullable()
    .transform((val) => (val === null ? undefined : val)),
  servings: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .nullable()
    .transform((val) => (val === null ? undefined : val)),
  category: mealCategories.optional(), // Meal category
  imageUrl: z.string().url().optional().or(z.literal("")),
  ublic: z.boolean().default(false),
  ingredients: z
    .array(
      z.object({
        name: z.string().min(1, { message: "Ingredient name is required" }),
        quantity: z.string().min(1, { message: "Quantity is required" }),
        unit: unitTypes.optional(),
        category: ingredientCategories.optional(),
        isOptional: z.boolean().default(false),
        notes: z.string().optional(),
      }),
    )
    .min(1, { message: "At least one ingredient is required." }), // Optional: Ensure at least one ingredient
});
// --- End Updated Zod Schema ---

export type MealAddFormValues = z.infer<typeof formSchema>;

// --- Updated Default Values ---
const DEFAULT_VALUES: MealAddFormValues = {
  // Use MealFormValues type
  name: "",
  description: "",
  instructions: "",
  prepTimeMinutes: undefined,
  cookTimeMinutes: undefined,
  servings: undefined,
  category: undefined, // Meal category
  imageUrl: "",
  ublic: false,
  ingredients: [
    {
      name: "",
      quantity: "",
      unit: undefined,
      category: undefined, // <-- Add default category
      isOptional: false,
      notes: "",
    },
  ],
};
// --- End Updated Default Values ---

export default function AddMealForm() {
  const [ending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "ingredients",
  });

  function onSubmit(values: MealAddFormValues) {
    startTransition(async () => {
      // Ensure your server action `addMealAction` is updated
      // to handle the new `category` field within the ingredients array.
      const result = await addMealAction(values);

      if (result.success && result.mealId) {
        // Check for mealId if action returns it
        form.reset(DEFAULT_VALUES);
        router.push(`/meals/${result.mealId}`); // Redirect to the new meal page
        toast({
          title: "Success",
          description: "Meal added successfully!",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Something went wrong adding the meal.",
          variant: "destructive",
        });
      }
    });
  }

  const handleAddIngredient = () => {
    append({
      name: "",
      quantity: "",
      unit: undefined,
      category: undefined, // <-- Add default category on append
      isOptional: false,
      notes: "",
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {" "}
      {/* Increased max-width */}
      <h1 className="text-2xl font-bold mb-6">Add New Meal</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Meal Name and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
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
              control={form.control}
              name="category" // Meal category
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
                      {MEAL_CATEGORY_ENUM.enumValues.map((category) => (
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
            control={form.control}
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
            control={form.control}
            name="instructions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instructions</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Step-by-step instructions..."
                    className="min-h-32"
                    {...field}
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
              control={form.control}
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
              control={form.control}
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
              control={form.control}
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
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Image URL</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://example.com/image.jpg"
                    {...field}
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
            control={form.control}
            name="ublic"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    id="ublicCheckbox"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel htmlFor="ublicCheckbox">
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
            {/* Display validation error for the ingredients array itself */}
            <FormMessage>
              {form.formState.errors.ingredients?.root?.message}
            </FormMessage>

            {fields.map((field, index) => (
              <Card
                key={field.id}
                className="overflow-hidden border shadow-sm bg-gray-50/50 dark:bg-gray-800/20"
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-base font-medium text-gray-700 dark:text-gray-300">
                      Ingredient #{index + 1}
                    </h4>
                    {/* Allow removing only if more than one ingredient exists */}
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                        className="h-8 w-8 p-0 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50"
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove Ingredient</span>
                      </Button>
                    )}
                  </div>

                  {/* Ingredient Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Name */}
                    <FormField
                      control={form.control}
                      name={`ingredients.${index}.name`}
                      render={({ field }) => (
                        <FormItem className="lg:col-span-1">
                          <FormLabel>Name*</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., All-purpose Flour"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Quantity */}
                    <FormField
                      control={form.control}
                      name={`ingredients.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity*</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 2" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Unit */}
                    <FormField
                      control={form.control}
                      name={`ingredients.${index}.unit`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value ?? ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select unit" />
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

                    {/* --- NEW: Ingredient Category --- */}
                    <FormField
                      control={form.control}
                      name={`ingredients.${index}.category`}
                      render={({ field }) => (
                        <FormItem className="lg:col-span-1">
                          <FormLabel>Category</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value ?? ""}
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
                                    {/* Replace underscores with spaces for display */}
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
                    {/* --- END NEW --- */}

                    {/* Notes */}
                    <FormField
                      control={form.control}
                      name={`ingredients.${index}.notes`}
                      render={({ field }) => (
                        <FormItem className="lg:col-span-1">
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., finely chopped"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Is Optional */}
                    <FormField
                      control={form.control}
                      name={`ingredients.${index}.isOptional`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 rounded-md pt-8">
                          {" "}
                          {/* Adjusted alignment */}
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              id={`isOptional-${index}`}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel htmlFor={`isOptional-${index}`}>
                              Optional
                            </FormLabel>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {/* --- End Ingredients Section --- */}

          <Button type="submit" className="w-full" disabled={ending}>
            {ending ? "Adding Meal..." : "Add Meal"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
