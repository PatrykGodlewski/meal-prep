"use client";

import React, { useState, useCallback } from "react";
import {
  useFormContext,
  type Control,
  type UseFormSetValue,
  type UseFormWatch,
} from "react-hook-form";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Doc } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { INGREDIENT_CATEGORIES, UNITS } from "@/convex/schema";
import type { MealAddFormValues, MealUpdateFormValues } from "./schema"; // Import both types
import { useTranslations } from "next-intl";

interface IngredientInputRowProps {
  index: number;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  control: Control<any>; // Accept either form type
  availableIngredients: Doc<"ingredients">[];
  onRemove: () => void;
  // Pass setValue and watch down from the parent form
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  setValue: UseFormSetValue<any>;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  field: any;
}

export const IngredientInputRow: React.FC<IngredientInputRowProps> = React.memo(
  ({ index, control, availableIngredients, onRemove, setValue, field }) => {
    const [popoverOpen, setPopoverOpen] = useState(false);
    const t = useTranslations("ingredient");

    const ingredientDefId = field.id;

    // Callback to populate fields when an existing ingredient is selected
    const handleSelectExistingIngredient = useCallback(
      (ingredientId: string | undefined) => {
        const selected = availableIngredients.find(
          (ing) => ing._id === ingredientId,
        );
        if (selected) {
          setValue(`ingredients.${index}.id`, selected._id, {
            shouldDirty: true,
          });
          setValue(`ingredients.${index}.name`, selected.name, {
            shouldDirty: true,
            shouldValidate: true,
          });
          setValue(
            `ingredients.${index}.category`,
            selected.category ?? "other",
            { shouldDirty: true },
          );
          setValue(`ingredients.${index}.unit`, selected.unit ?? "g", {
            shouldDirty: true,
          });
          setValue(`ingredients.${index}.calories`, selected.calories ?? 0, {
            shouldDirty: true,
          });
        } else {
          setValue(`ingredients.${index}._id`, undefined, {
            shouldDirty: true,
          });
        }
        setPopoverOpen(false);
      },
      [availableIngredients, index, setValue],
    );

    return (
      <Card className="p-4 bg-gray-50 dark:bg-neutral-800/50 border dark:border-neutral-700">
        <div className="flex justify-between items-center mb-3">
          <span className="font-medium text-sm text-gray-700 dark:text-gray-300">
            Ingredient #{index + 1}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="h-6 w-6 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50"
            aria-label="Remove Ingredient"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
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
                        aria-expanded={popoverOpen}
                        className={cn(
                          "w-full justify-between font-normal",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {field.value
                          ? field.value // Display the current value directly
                          : "Select or type..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-(--radix-popover-trigger-width) max-h-(--radix-popover-content-available-height) p-0">
                    <Command shouldFilter={true}>
                      {/* Input tracks the name field */}
                      <CommandInput
                        placeholder="Search or type new..."
                        value={field.value}
                        onValueChange={(search) => {
                          field.onChange(search); // Update the name field
                          // // If typing a new name, clear the ID
                          // const match = availableIngredients.find(
                          //   (ing) =>
                          //     ing.name.toLowerCase() === search.toLowerCase(),
                          // );
                          // if (!match && ingredientDefId) {
                          //   handleSelectExistingIngredient(undefined); // Clear ID if no match found
                          // } else if (match && ingredientDefId !== match._id) {
                          //   // If a match is found but ID is different, update everything
                          //   handleSelectExistingIngredient(match._id);
                          // }
                        }}
                      />
                      <CommandList>
                        <CommandEmpty>
                          No ingredient found. Type to add new.
                        </CommandEmpty>
                        <CommandGroup>
                          {availableIngredients.map((ing) => (
                            <CommandItem
                              key={ing._id}
                              value={ing.name} // Value used for filtering/selection
                              onSelect={() => {
                                // On selecting an existing item, populate all fields
                                handleSelectExistingIngredient(ing._id);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  ingredientDefId === ing._id
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
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Quantity */}
          <FormField
            control={control}
            name={`ingredients.${index}.quantity`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Quantity*</FormLabel>
                <FormControl>
                  <Input
                    type="number" // Ensure numeric input
                    step="any" // Allow decimals if needed
                    placeholder="e.g., 2"
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)} // Use valueAsNumber
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name={`ingredients.${index}.unit`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Unit*</FormLabel>
                <Select
                  value={field.value ?? "g"} // Default to 'g'
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {UNITS.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {t(unit)}
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
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Category*</FormLabel>
                <Select
                  value={field.value ?? "other"}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {INGREDIENT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat} className="capitalize">
                        {t(cat)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Notes */}
          <FormField
            control={control}
            name={`ingredients.${index}.notes`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Notes</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
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
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-2 pt-5 self-end mb-1">
                {" "}
                {/* Align with bottom of inputs */}
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
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

          <FormField
            control={control}
            name={`ingredients.${index}.calories`}
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
      </Card>
    );
  },
);
IngredientInputRow.displayName = "IngredientInputRow";
