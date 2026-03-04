"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useCallback, useState } from "react";
import type { Control, UseFormSetValue } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Doc } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface IngredientSelectorProps {
  index: number;
  control: Control<any>;
  availableIngredients: Doc<"ingredients">[];
  setValue: UseFormSetValue<any>;
  selectedIngredientId: string | undefined;
}

export const IngredientSelector = React.memo(function IngredientSelector({
  index,
  control,
  availableIngredients,
  setValue,
  selectedIngredientId,
}: IngredientSelectorProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const t = useTranslations("ingredient");
  const tMeal = useTranslations("mealEditor");

  const handleSelect = useCallback(
    (ingredientId: string | undefined) => {
      const selected = availableIngredients.find((ing) => ing._id === ingredientId);
      if (selected) {
        setValue(`ingredients.${index}.ingredientId`, selected._id, { shouldDirty: true });
        setValue(`ingredients.${index}.name`, selected.name, {
          shouldDirty: true,
          shouldValidate: true,
        });
        setValue(`ingredients.${index}.category`, selected.category ?? "other", {
          shouldDirty: true,
        });
        setValue(`ingredients.${index}.unit`, selected.unit ?? "g", { shouldDirty: true });
        setValue(`ingredients.${index}.calories`, selected.calories ?? 0, { shouldDirty: true });
        setValue(`ingredients.${index}.allowedReplacementIds`, undefined, { shouldDirty: true });
      } else {
        setValue(`ingredients.${index}.ingredientId`, undefined, { shouldDirty: true });
      }
      setPopoverOpen(false);
    },
    [availableIngredients, index, setValue],
  );

  return (
    <FormField
      control={control}
      name={`ingredients.${index}.name`}
      render={({ field }) => (
        <FormItem className="flex flex-col sm:col-span-2 lg:col-span-1 xl:col-span-1">
          <FormLabel className="text-xs">{tMeal("ingredientLabel")}*</FormLabel>
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  aria-expanded={popoverOpen}
                  className={cn(
                    "h-10 w-full justify-between rounded-lg border border-input bg-transparent font-normal shadow-xs transition-colors hover:border-input/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:bg-input/30",
                    !field.value && "text-muted-foreground",
                  )}
                >
                  {field.value ? field.value : tMeal("ingredientSelectPlaceholder")}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="max-h-(--radix-popover-content-available-height) w-(--radix-popover-trigger-width) rounded-lg border border-input p-0 shadow-lg">
              <Command shouldFilter>
                <CommandInput
                  placeholder={tMeal("ingredientSearchPlaceholder")}
                  value={field.value}
                  onValueChange={field.onChange}
                />
                <CommandList>
                  <CommandEmpty>{tMeal("ingredientEmptyState")}</CommandEmpty>
                  <CommandGroup>
                    {availableIngredients.map((ing) => (
                      <CommandItem
                        key={ing._id}
                        value={ing.name}
                        onSelect={() => handleSelect(ing._id as string)}
                      >
                        <Check
                          className={cn("mr-2 h-4 w-4", (selectedIngredientId ?? "") === ing._id ? "opacity-100" : "opacity-0")}
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
  );
});
