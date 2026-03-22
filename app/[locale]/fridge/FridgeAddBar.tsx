"use client";

import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation } from "@tanstack/react-query";
import { useDebounceFn } from "ahooks";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
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
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { usePaginatedIngredients } from "@/hooks/use-paginated-ingredients";
import { cn } from "@/lib/utils";

export default function FridgeAddBar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [amount, setAmount] = useState(1);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const t = useTranslations("fridge");

  const { allIngredients, isFetching } = usePaginatedIngredients({
    clientSearch: searchTerm,
  });

  const { mutate: addItem, isPending: isAdding } = useMutation({
    mutationFn: useConvexMutation(api.fridge.addFridgeItem),
    onSuccess: () => {
      toast.success(t("addSuccess"));
      setInputValue("");
      setSearchTerm("");
      setAmount(1);
      setPopoverOpen(false);
    },
    onError: (error) => {
      toast.error(t("addError"));
      console.error(error);
    },
  });

  const debouncedSearch = useDebounceFn((term: string) => setSearchTerm(term), {
    wait: 250,
  });

  useEffect(() => {
    if (!popoverOpen) {
      setInputValue("");
      setSearchTerm("");
    }
  }, [popoverOpen]);

  const handleSelect = useCallback(
    (ingredient: Doc<"ingredients">) => {
      addItem({
        ingredientId: ingredient._id,
        amount,
      });
    },
    [addItem, amount],
  );

  return (
    <div className="mb-6 rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-muted/30">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-2">
          <Label htmlFor="fridge-add" className="font-medium text-sm">
            {t("addIngredient")}
          </Label>
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              {/* biome-ignore lint/a11y/useSemanticElements: searchable Command popover; native <select> cannot async-search ingredients */}
              <Button
                id="fridge-add"
                variant="outline"
                role="combobox"
                aria-expanded={popoverOpen}
                aria-haspopup="listbox"
                className={cn(
                  "h-11 w-full justify-between font-normal sm:w-auto sm:min-w-[220px]",
                  !inputValue && "text-muted-foreground",
                )}
              >
                <span className="truncate">
                  {inputValue || t("searchPlaceholder")}
                </span>
                <Plus className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[--radix-popover-trigger-width] p-0"
              align="start"
              onOpenAutoFocus={(e) => e.preventDefault()}
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
                    {allIngredients.map((ing) => (
                      <CommandItem
                        key={ing._id}
                        value={ing.name}
                        onSelect={() => handleSelect(ing)}
                        className="cursor-pointer"
                      >
                        <span className="truncate">{ing.name}</span>
                        <span className="ml-2 shrink-0 text-muted-foreground text-xs">
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
        <div className="flex shrink-0 items-end gap-2">
          <div className="space-y-2">
            <Label htmlFor="fridge-amount" className="font-medium text-sm">
              {t("amount")}
            </Label>
            <Input
              id="fridge-amount"
              type="number"
              min={0.01}
              step={0.5}
              value={amount}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!Number.isNaN(v) && v > 0) setAmount(v);
              }}
              className="h-11 w-24 text-right tabular-nums"
              disabled={isAdding}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
