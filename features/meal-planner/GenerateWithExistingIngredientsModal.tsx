"use client";

import { useDebounceFn } from "ahooks";
import { Loader2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { usePaginatedIngredients } from "@/hooks/use-paginated-ingredients";

type ExistingIngredientEntry = {
  ingredientId: Id<"ingredients">;
  name: string;
  unit: string;
  amount: number;
};

interface GenerateWithExistingIngredientsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (
    existingIngredients: { ingredientId: Id<"ingredients">; amount: number }[],
  ) => void;
  isGenerating: boolean;
}

export function GenerateWithExistingIngredientsModal({
  isOpen,
  onOpenChange,
  onGenerate,
  isGenerating,
}: GenerateWithExistingIngredientsModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [entries, setEntries] = useState<ExistingIngredientEntry[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const t = useTranslations("generateWithExistingIngredients");

  const { allIngredients, isFetching } = usePaginatedIngredients({
    clientSearch: searchTerm,
  });

  const debouncedSearch = useDebounceFn((term: string) => setSearchTerm(term), {
    wait: 250,
  });

  useEffect(() => {
    if (!isOpen) {
      setEntries([]);
      setInputValue("");
      setSearchTerm("");
      setPopoverOpen(false);
    }
  }, [isOpen]);

  const handleSelectIngredient = (ingredient: Doc<"ingredients">) => {
    if (entries.some((e) => e.ingredientId === ingredient._id)) {
      setPopoverOpen(false);
      return;
    }
    setEntries((prev) => [
      ...prev,
      {
        ingredientId: ingredient._id,
        name: ingredient.name,
        unit: ingredient.unit ?? "piece",
        amount: 1,
      },
    ]);
    setInputValue("");
    setSearchTerm("");
    setPopoverOpen(false);
  };

  const handleAmountChange = (
    ingredientId: Id<"ingredients">,
    amount: number,
  ) => {
    setEntries((prev) =>
      prev.map((e) => (e.ingredientId === ingredientId ? { ...e, amount } : e)),
    );
  };

  const handleRemove = (ingredientId: Id<"ingredients">) => {
    setEntries((prev) => prev.filter((e) => e.ingredientId !== ingredientId));
  };

  const handleGenerate = () => {
    onGenerate(
      entries.map((e) => ({ ingredientId: e.ingredientId, amount: e.amount })),
    );
    onOpenChange(false);
  };

  const filteredIngredients = allIngredients.filter(
    (ing) => !entries.some((e) => e.ingredientId === ing._id),
  );

  return (
    <Dialog modal open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="add-ingredient-combobox"
              className="font-medium text-sm"
            >
              {t("addIngredient")}
            </label>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                {/* biome-ignore lint/a11y/useSemanticElements: searchable Command popover; native <select> cannot async-search ingredients */}
                <Button
                  id="add-ingredient-combobox"
                  variant="outline"
                  role="combobox"
                  aria-expanded={popoverOpen}
                  className="w-full justify-between font-normal"
                >
                  {inputValue || t("searchPlaceholder")}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[--radix-popover-trigger-width] p-0"
                align="start"
              >
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder={t("searchPlaceholder")}
                    value={inputValue}
                    onValueChange={(v) => {
                      setInputValue(v);
                      debouncedSearch.run(v);
                    }}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {isFetching ? t("searching") : t("noIngredientsFound")}
                    </CommandEmpty>
                    <CommandGroup>
                      {filteredIngredients.map((ing) => (
                        <CommandItem
                          key={ing._id}
                          value={ing.name}
                          onSelect={() => handleSelectIngredient(ing)}
                        >
                          {ing.name}{" "}
                          <span className="text-muted-foreground text-xs">
                            ({ing.unit})
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {entries.length > 0 && (
            <div className="space-y-2 overflow-y-auto">
              <span className="font-medium text-sm">
                {t("ingredientsYouHave")}
              </span>
              <div className="space-y-2 rounded-md border p-3">
                {entries.map((entry) => (
                  <div
                    key={entry.ingredientId}
                    className="flex items-center gap-2"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {entry.name}
                    </span>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={0.01}
                        step={0.5}
                        value={entry.amount}
                        aria-label={`${entry.name} amount`}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          if (!Number.isNaN(v) && v > 0) {
                            handleAmountChange(entry.ingredientId, v);
                          }
                        }}
                        className="h-8 w-20 text-right"
                        placeholder="1"
                      />
                      <span className="shrink-0 text-muted-foreground text-xs">
                        {entry.unit}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => handleRemove(entry.ingredientId)}
                      aria-label={t("remove")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || entries.length === 0}
          >
            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("generate")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
