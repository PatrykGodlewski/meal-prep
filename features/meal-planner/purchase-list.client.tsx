"use client";

import { useId } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useMealPlanner } from "./store";
import { useMutation } from "@tanstack/react-query";
import { For } from "@/components/for-each";
import { camelCase, snakeCase } from "lodash";
import { useConvexMutation } from "@convex-dev/react-query";
import { api } from "@/convex/_generated/api";
import { toast } from "@/hooks/use-toast";
import type { Id } from "@/convex/_generated/dataModel";
import { ShoppingCart } from "lucide-react";
import { DatePickerWithPresets } from "./date-picker";
import { use$ } from "@legendapp/state/react";
import { useTranslations } from "next-intl";
import { Separator } from "@/components/ui/separator";

export function ShoppingListDisplay() {
  const { shoppingListData: list } = useMealPlanner();
  const t = useTranslations("mealPlanner");
  const tIngredient = useTranslations("ingredient");

  const items = list?.items ?? [];

  const groupedItems = Object.groupBy(
    items,
    (item) => item?.ingredient?.category ?? "other",
  );

  const shoppingItems = Object.entries(groupedItems).sort();

  return (
    <div className="p-4 border rounded-lg shadow-xs bg-white hover:bg-neutral-100/75 dark:hover:bg-neutral-900 dark:bg-neutral-950/75 ease-in duration-700 transition-colors min-h-[500px]">
      <div className={"flex  flex-wrap justify-between"}>
        <h1 className="text-3xl font-bold flex items-center gap-4 border-b pb-4">
          <ShoppingCart />
          {t("shoppingList")}
        </h1>

        <DatePickerWithPresets />
      </div>
      <Separator className="my-2" />
      <ul className="space-y-2">
        <For each={shoppingItems} empty={"empty shopping list"}>
          {([category, categoryItems]) => (
            <div key={category} className="space-y-2">
              <h2 className="capitalize font-bold text-2xl py-2">
                {tIngredient(camelCase(category))}
              </h2>
              <For
                each={categoryItems.sort(
                  (a, b) =>
                    a.ingredient?.name.localeCompare(
                      b.ingredient?.name ?? "",
                    ) ?? 0,
                )}
                empty={t("noIngredients")}
              >
                {(item) => (
                  <ShoppingListItem
                    key={item.ingredientId}
                    amount={item.amount}
                    unit={item.ingredient?.unit}
                    name={item.ingredient?.name}
                    isChecked={item.isChecked}
                    ids={item.itemIds}
                  />
                )}
              </For>
            </div>
          )}
        </For>
      </ul>
    </div>
  );
}

type Props = {
  amount: number;
  unit?: string;
  name?: string;
  isChecked: boolean;
  ids: Id<"shoppingListItems">[];
};

function ShoppingListItem({ amount, unit, name, isChecked, ids }: Props) {
  const { mealPlannerState$ } = useMealPlanner();

  const uniqueId = useId();
  const labelId = `${uniqueId}-label`;

  const startDate = use$(mealPlannerState$.shoppingListDate)?.from?.getTime();
  const endDate = use$(mealPlannerState$.shoppingListDate)?.to?.getTime();

  const { mutate } = useMutation({
    mutationFn: useConvexMutation(
      api.shoppingList.updateShoppingListItem,
    ).withOptimisticUpdate((localStore, args) => {
      const { checked } = args;

      const currentValue = localStore.getQuery(
        api.shoppingList.getShoppingList,
        {
          startDate,
          endDate,
        },
      );

      if (currentValue) {
        const updatedItems = currentValue.items.map((item) => {
          const sortedArr1 = [...ids].sort();
          const sortedArr2 = [...item.itemIds].sort();
          return sortedArr1.every((value, index) => value === sortedArr2[index])
            ? { ...item, isChecked: checked }
            : item;
        });

        const updatedValue = {
          ...currentValue,
          items: updatedItems,
        };

        localStore.setQuery(
          api.shoppingList.getShoppingList,
          {
            startDate,
            endDate,
          },
          updatedValue,
        );
      }
    }),

    onError: (error) => {
      console.error(error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    },
  });

  const handleCheckChange = () => {
    mutate({ checked: !isChecked, shoppingListItemIds: ids });
  };

  return (
    <li>
      <Label
        htmlFor={uniqueId}
        id={labelId}
        className={cn(
          "flex items-center p-3 justify-between rounded-md border bg-neutral-0 dark:bg-neutral-800 border-neutral-700 shadow-xs transition-colors",
          "hover:bg-neutral-100 dark:hover:bg-neutral-700/50 cursor-pointer",
        )}
      >
        <div className="flex items-center gap-2">
          <Checkbox
            id={uniqueId}
            checked={isChecked}
            onCheckedChange={handleCheckChange}
            aria-labelledby={labelId}
          />
          <span
            className={cn("text-sm font-medium", {
              "line-through text-neutral-500": isChecked,
            })}
          >
            {name}
          </span>
        </div>
        <span
          className={cn("text-sm italic", {
            "text-gray-400": isChecked,
          })}
        >
          {amount} {unit}
        </span>
      </Label>
    </li>
  );
}
