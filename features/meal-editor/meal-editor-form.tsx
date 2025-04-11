// components/meal-edit-form.tsx
"use client";

import { useState, useCallback, useMemo } from "react"; // Added useState
import { type Control, useFieldArray, useFormContext } from "react-hook-form";
import * as z from "zod";
import { Clock, Plus, Users, X, ChevronsUpDown, Check } from "lucide-react"; // Added icons
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
} from "@/components/ui/form";
import { Card } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"; // Added Popover
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"; // Added Command
import { cn } from "@/lib/utils"; // Shadcn utility
import {
  INGREDIENT_CATEGORY_ENUM,
  MEAL_CATEGORY_ENUM,
  UNIT_ENUM,
  type Ingredient,
} from "@/supabase/schema";
import { unitTypes, ingredientCategories, mealCategories } from "@/validators"; // Adjust path if needed

const IngredientFormSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Ingredient name is required"),
  category: ingredientCategories,
  unit: unitTypes,
  quantity: z.string().min(1, "Quantity is required"),
  isOptional: z.boolean().default(false),
  notes: z.string().nullable().optional(),
});

export const MealFormSchema = z.object({
  id: z.string().uuid("Meal ID is required for updates."),
  name: z.string().min(2, "Meal name must be at least 2 characters."),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters."),
  instructions: z.string().nullable().optional(),
  prepTimeMinutes: z.coerce.number().int().positive().nullable().optional(),
  cookTimeMinutes: z.coerce.number().int().positive().nullable().optional(),
  servings: z.coerce.number().int().positive().nullable().optional(),
  category: mealCategories,
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
type IngredientFormState = z.infer<typeof IngredientFormSchema>;

const NEW_INGREDIENT_DEFAULT: IngredientFormState = {
  name: "",
  quantity: "",
  unit: "g",
  category: "other",
  isOptional: false,
  notes: null,
};

// --- Edit Form Component Props ---
interface MealEditFormProps {
  availableIngredients: Ingredient[];
  isLoadingIngredients: boolean;
}

// --- Edit Form Component ---
export function MealEditForm({
  availableIngredients = [],
  isLoadingIngredients,
}: MealEditFormProps) {
  const form = useFormContext<MealUpdateFormValues>();
  const { control, setValue } = form;

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

  // --- Handle Ingredient Selection ---
  // This function now primarily sets the associated data *after* an ID is selected
  const populateIngredientData = useCallback(
    (index: number, selectedIngredientId: string | null | undefined) => {
      const selected = availableIngredients.find(
        (ing) => ing.id === selectedIngredientId,
      );
      if (selected) {
        // Set ID, Name, Category, Unit based on selection
        setValue(`ingredients.${index}.id`, selected.id, { shouldDirty: true });
        setValue(`ingredients.${index}.name`, selected.name, {
          shouldDirty: true,
          shouldValidate: true,
        }); // Validate name after setting
        setValue(
          `ingredients.${index}.category`,
          selected.category ?? "other",
          {
            shouldDirty: true,
          },
        );
        setValue(`ingredients.${index}.unit`, selected.unit ?? "g", {
          shouldDirty: true,
        });
      } else {
        // If selection is cleared or invalid, potentially clear related fields
        // but keep the typed name if the user is creating a new one.
        // We only clear the ID here. The name is handled by the input itself.
        setValue(`ingredients.${index}.id`, undefined); // Clear the definition ID
        // Maybe clear category/unit if user clears selection? Optional.
        // setValue(`ingredients.${index}.category`, null);
        // setValue(`ingredients.${index}.unit`, null);
      }
    },
    [availableIngredients, setValue],
  );
  // --- End Handle Selection ---

  return (
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
                {" "}
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
                {" "}
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
                key={field.id} // Use stable key from useFieldArray
                index={index}
                control={control}
                availableIngredients={availableIngredients}
                isLoadingIngredients={isLoadingIngredients}
                onRemove={() => handleRemoveIngredient(index)}
                canRemove={fields.length > 1}
                onSelectIngredient={populateIngredientData} // Pass population handler
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
  );
}
MealEditForm.displayName = "MealEditForm";

// --- Ingredient Input Row Sub-Component ---
interface IngredientInputRowProps {
  index: number;
  control: Control<MealUpdateFormValues>; // Control object from useFormContext
  availableIngredients: Ingredient[];
  isLoadingIngredients: boolean;
  onRemove: () => void;
  canRemove: boolean;
  onSelectIngredient: (
    index: number,
    ingredientId: string | null | undefined,
  ) => void;
}

const IngredientInputRow: React.FC<IngredientInputRowProps> = ({
  index,
  control,
  availableIngredients,
  isLoadingIngredients,
  onRemove,
  canRemove,
  onSelectIngredient,
}) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const { watch, setValue } = useFormContext<MealUpdateFormValues>(); // Get watch and setValue

  // Watch the ID and Name for this row
  const ingredientId = watch(`ingredients.${index}.id`);
  const ingredientName = watch(`ingredients.${index}.name`);

  // Determine if the user is likely creating a *new* ingredient
  // This happens when there's a name typed, but no matching ID is set
  const isCreatingNew = useMemo(() => {
    return !!ingredientName && !ingredientId;
  }, [ingredientName, ingredientId]);

  // Watch unit and category separately ONLY if not creating new,
  // otherwise, they should be editable via FormField
  const selectedUnit = !isCreatingNew
    ? watch(`ingredients.${index}.unit`)
    : undefined;
  const selectedCategory = !isCreatingNew
    ? watch(`ingredients.${index}.category`)
    : undefined;

  return (
    <Card className="p-4 bg-gray-50 dark:bg-neutral-800/50 border dark:border-neutral-700">
      <div className="flex justify-between items-center mb-3">
        <span className="font-medium text-sm text-gray-700 dark:text-gray-300">
          Ingredient #{index + 1}
        </span>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="h-6 w-6 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Remove</span>
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Ingredient Combobox */}
        <FormField
          control={control}
          name={`ingredients.${index}.name`}
          render={({ field }) => (
            <FormItem className="flex flex-col sm:col-span-2 lg:col-span-1">
              <FormLabel className="text-xs">Ingredient*</FormLabel>
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      // role="combobox"
                      aria-expanded={popoverOpen}
                      className={cn(
                        "w-full justify-between font-normal",
                        !field.value && "text-muted-foreground",
                      )}
                      disabled={isLoadingIngredients}
                    >
                      {field.value
                        ? (availableIngredients.find(
                            (ing) => ing.name === field.value,
                          )?.name ?? field.value)
                        : isLoadingIngredients
                          ? "Loading..."
                          : "Select or type ingredient..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                  <Command shouldFilter={true}>
                    <CommandInput
                      placeholder="Search or type new..."
                      value={field.value}
                      onValueChange={(search) => {
                        field.onChange(search);
                        // Check if typed value matches existing *after* updating field value
                        const match = availableIngredients.find(
                          (ing) =>
                            ing.name.toLowerCase() === search.toLowerCase(),
                        );
                        if (!match) {
                          // If no match, clear ID (signals new ingredient)
                          onSelectIngredient(index, null);
                        } else if (
                          watch(`ingredients.${index}.id`) !== match.id
                        ) {
                          // If matches but ID isn't set yet, set it
                          onSelectIngredient(index, match.id);
                        }
                      }}
                    />
                    <CommandList>
                      <CommandEmpty>
                        No ingredient found. Type to add new.
                      </CommandEmpty>
                      <CommandGroup>
                        {availableIngredients.map((ing) => (
                          <CommandItem
                            key={ing.id}
                            value={ing.name}
                            onSelect={(currentValue) => {
                              const selected = availableIngredients.find(
                                (i) =>
                                  i.name.toLowerCase() ===
                                  currentValue.toLowerCase(),
                              );
                              field.onChange(
                                selected ? selected.name : currentValue,
                              );
                              onSelectIngredient(index, selected?.id);
                              setPopoverOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                watch(`ingredients.${index}.id`) === ing.id
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            {ing.name} {ing.unit ? `(${ing.unit})` : ""}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormField
                control={control}
                name={`ingredients.${index}.id`}
                render={({ field: idField }) => (
                  <input
                    type="hidden"
                    {...idField}
                    value={idField.value ?? ""}
                  />
                )}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Quantity */}
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

        {/* Unit (Conditional: Select if creating new, ReadOnly if existing) */}
        {isCreatingNew ? (
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
        ) : (
          <FormItem>
            <FormLabel className="text-xs text-gray-500 dark:text-gray-400">
              Unit
            </FormLabel>
            <Input
              readOnly
              disabled
              value={selectedUnit ?? "-"}
              className="bg-gray-100 dark:bg-neutral-700 border-gray-300 dark:border-neutral-600"
            />
          </FormItem>
        )}

        {/* Category (Conditional: Select if creating new, ReadOnly if existing) */}
        {isCreatingNew ? (
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
                    {INGREDIENT_CATEGORY_ENUM.enumValues.map((cat) => (
                      <SelectItem key={cat} value={cat} className="capitalize">
                        {cat.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <FormItem>
            <FormLabel className="text-xs text-gray-500 dark:text-gray-400">
              Category
            </FormLabel>
            <Input
              readOnly
              disabled
              value={selectedCategory?.replace(/_/g, " ") ?? "-"}
              className="bg-gray-100 dark:bg-neutral-700 border-gray-300 dark:border-neutral-600 capitalize"
            />
          </FormItem>
        )}

        {/* Notes */}
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

        {/* Optional */}
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
  );
};
IngredientInputRow.displayName = "IngredientInputRow";
