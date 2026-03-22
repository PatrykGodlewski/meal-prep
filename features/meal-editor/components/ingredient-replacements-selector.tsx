"use client";

import { CheckIcon, ChevronsUpDown } from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useState } from "react";
import type { Control } from "react-hook-form";
import { useWatch } from "react-hook-form";
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
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ReplacementOption {
  label: string;
  value: string;
  defaultRatio?: number;
}

interface IngredientReplacementsSelectorProps {
  index: number;
  // biome-ignore lint/suspicious/noExplicitAny: react-hook-form Control requires form type; meal form type varies
  control: Control<any>;
  replacementOptions: ReplacementOption[];
  hasDefaultReplacements: boolean;
}

const TRIGGER_STYLE =
  "h-10 w-full justify-between rounded-lg border border-input bg-transparent font-normal shadow-xs transition-colors hover:border-input/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30";

export const IngredientReplacementsSelector = React.memo(
  function IngredientReplacementsSelector({
    index,
    control,
    replacementOptions,
    hasDefaultReplacements,
  }: IngredientReplacementsSelectorProps) {
    const [popoverOpen, setPopoverOpen] = useState(false);
    const tMeal = useTranslations("mealEditor");
    const quantity =
      useWatch({ control, name: `ingredients.${index}.quantity` }) ?? 0;
    const unit =
      useWatch({ control, name: `ingredients.${index}.unit` }) ?? "g";

    if (replacementOptions.length === 0) return null;

    return (
      <FormField
        control={control}
        name={`ingredients.${index}.allowedReplacements`}
        render={({ field }) => {
          const selected = (field.value ?? []) as {
            ingredientId: string;
            ratio?: number;
          }[];
          const displayText =
            selected.length > 0
              ? selected
                  .map((s) => {
                    const opt = replacementOptions.find(
                      (o) => o.value === s.ingredientId,
                    );
                    const ratio = s.ratio ?? opt?.defaultRatio ?? 1;
                    const calculated = Math.round((quantity as number) * ratio);
                    return opt ? `${opt.label} (${calculated} ${unit})` : null;
                  })
                  .filter(Boolean)
                  .join(", ")
              : null;

          const toggleOption = (value: string, ratio: number) => {
            const exists = selected.find((s) => s.ingredientId === value);
            const next = exists
              ? selected.filter((s) => s.ingredientId !== value)
              : [...selected, { ingredientId: value, ratio }];
            field.onChange(next);
          };

          const updateRatio = (ingredientId: string, ratio: number) => {
            const next = selected.map((s) =>
              s.ingredientId === ingredientId ? { ...s, ratio } : s,
            );
            field.onChange(next);
          };

          return (
            <div className="col-span-full">
              <FormItem>
                <FormLabel className="text-xs">
                  {tMeal("overrideReplacements")}
                </FormLabel>
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        aria-expanded={popoverOpen}
                        className={cn(
                          TRIGGER_STYLE,
                          !displayText && "text-muted-foreground",
                        )}
                      >
                        {displayText ??
                          tMeal("overrideReplacementsPlaceholder")}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent
                    className="max-h-(--radix-popover-content-available-height) min-w-80 rounded-lg border border-input p-0 shadow-lg"
                    align="start"
                  >
                    <Command shouldFilter>
                      <CommandInput
                        placeholder={tMeal("ingredientSearchPlaceholder")}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {tMeal("ingredientEmptyState")}
                        </CommandEmpty>
                        <CommandGroup>
                          {replacementOptions.map((opt) => {
                            const entry = selected.find(
                              (s) => s.ingredientId === opt.value,
                            );
                            const isSelected = !!entry;
                            const ratio = entry?.ratio ?? opt.defaultRatio ?? 1;
                            return (
                              <CommandItem
                                key={opt.value}
                                value={opt.label}
                                onSelect={() =>
                                  toggleOption(opt.value, opt.defaultRatio ?? 1)
                                }
                                className="flex flex-col items-stretch gap-1"
                              >
                                <div className="flex w-full items-center">
                                  <CheckIcon
                                    className={cn(
                                      "mr-2 h-4 w-4 shrink-0",
                                      isSelected ? "opacity-100" : "opacity-0",
                                    )}
                                  />
                                  <span className="flex-1">{opt.label}</span>
                                  {isSelected && (
                                    <fieldset
                                      className="flex items-center gap-2 border-0 p-0"
                                      onClick={(e) => e.stopPropagation()}
                                      onKeyDown={(e) => {
                                        if (
                                          e.key === "Enter" ||
                                          e.key === " "
                                        ) {
                                          e.stopPropagation();
                                        }
                                      }}
                                    >
                                      <label
                                        htmlFor={`replacement-ratio-popover-${opt.value}`}
                                        className="whitespace-nowrap text-muted-foreground text-xs"
                                      >
                                        {tMeal("ratioLabel")}:
                                      </label>
                                      <Input
                                        id={`replacement-ratio-popover-${opt.value}`}
                                        type="number"
                                        step="0.1"
                                        min="0.1"
                                        placeholder="1"
                                        className="h-8 w-20 text-right"
                                        value={ratio}
                                        onChange={(e) => {
                                          const v = parseFloat(e.target.value);
                                          if (!Number.isNaN(v) && v > 0)
                                            updateRatio(opt.value, v);
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    </fieldset>
                                  )}
                                </div>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {selected.length > 0 && (
                  <div className="mt-2 space-y-2 rounded-lg border border-input/60 bg-muted/20 p-3 dark:bg-muted/10">
                    {selected.map((entry) => {
                      const opt = replacementOptions.find(
                        (o) => o.value === entry.ingredientId,
                      );
                      const ratio = entry.ratio ?? opt?.defaultRatio ?? 1;
                      const baseQty = (quantity as number) || 0;
                      const calculatedQty = Math.round(baseQty * ratio);
                      return (
                        <div
                          key={entry.ingredientId}
                          className="flex items-center gap-2"
                        >
                          <span className="flex-1 text-sm">
                            {opt?.label ?? entry.ingredientId}
                          </span>
                          <label
                            htmlFor={`replacement-ratio-${entry.ingredientId}`}
                            className="text-muted-foreground text-xs"
                          >
                            {tMeal("ratioLabel")}:
                          </label>
                          <Input
                            id={`replacement-ratio-${entry.ingredientId}`}
                            type="number"
                            step="0.1"
                            min="0.1"
                            placeholder="1"
                            className="h-8 w-20 text-right"
                            value={ratio}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              if (!Number.isNaN(v) && v > 0)
                                updateRatio(entry.ingredientId, v);
                            }}
                          />
                          <span className="text-muted-foreground text-xs">
                            = {calculatedQty} {unit}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
                <p className="mt-1 text-muted-foreground text-xs">
                  {hasDefaultReplacements
                    ? tMeal("overrideReplacementsHelp")
                    : tMeal("addReplacementsHelp")}{" "}
                  {tMeal("replacementRatioHelp")}
                </p>
                <FormMessage />
              </FormItem>
            </div>
          );
        }}
      />
    );
  },
);
