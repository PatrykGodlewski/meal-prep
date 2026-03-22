"use client";

import { CheckIcon, ChevronsUpDown, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface ReplacementEntry {
  ingredientId: string;
  ratio?: number;
}

interface ReplacementsEditorProps {
  value: ReplacementEntry[];
  onChange: (value: ReplacementEntry[]) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
  emptyOptionsMessage?: string;
}

export function ReplacementsEditor({
  value,
  onChange,
  options,
  placeholder,
  emptyOptionsMessage,
}: ReplacementsEditorProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const tEdit = useTranslations("ingredientEditor");

  const availableOptions = options.filter(
    (o) => !value.some((v) => v.ingredientId === o.value),
  );

  const addReplacement = (ingredientId: string, ratio: number) => {
    onChange([...value, { ingredientId, ratio }]);
    setPopoverOpen(false);
  };

  const removeReplacement = (ingredientId: string) => {
    onChange(value.filter((v) => v.ingredientId !== ingredientId));
  };

  const updateRatio = (ingredientId: string, ratio: number) => {
    onChange(
      value.map((v) => (v.ingredientId === ingredientId ? { ...v, ratio } : v)),
    );
  };

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="space-y-2 rounded-lg border border-input/60 bg-muted/20 p-3 dark:bg-muted/10">
          {value.map((entry) => {
            const opt = options.find((o) => o.value === entry.ingredientId);
            const ratio = entry.ratio ?? 1;
            return (
              <div key={entry.ingredientId} className="flex items-center gap-2">
                <span className="flex-1 text-sm">
                  {opt?.label ?? entry.ingredientId}
                </span>
                <label
                  htmlFor={`replacement-ratio-${entry.ingredientId}`}
                  className="whitespace-nowrap text-muted-foreground text-xs"
                >
                  {tEdit("ratioLabel")}:
                </label>
                <Input
                  id={`replacement-ratio-${entry.ingredientId}`}
                  type="number"
                  step="0.1"
                  min="0.1"
                  placeholder="1"
                  title={tEdit("ratioHelp")}
                  className="h-8 w-20 text-right"
                  value={ratio}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!Number.isNaN(v) && v > 0)
                      updateRatio(entry.ingredientId, v);
                  }}
                />
                <span className="shrink-0 text-muted-foreground text-xs">
                  (100→{Math.round(100 * ratio)})
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeReplacement(entry.ingredientId)}
                  aria-label="Remove"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
      {availableOptions.length > 0 && (
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="h-10 w-full justify-between font-normal"
            >
              {placeholder ?? tEdit("replacementsPlaceholder")}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-(--radix-popover-trigger-width) p-0"
            align="start"
          >
            <Command shouldFilter>
              <CommandInput placeholder={tEdit("replacementsPlaceholder")} />
              <CommandList>
                <CommandEmpty>
                  {emptyOptionsMessage ?? "No results"}
                </CommandEmpty>
                <CommandGroup>
                  {availableOptions.map((opt) => (
                    <CommandItem
                      key={opt.value}
                      value={opt.label}
                      onSelect={() => addReplacement(opt.value, 1)}
                    >
                      <CheckIcon className="mr-2 h-4 w-4 opacity-0" />
                      {opt.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
