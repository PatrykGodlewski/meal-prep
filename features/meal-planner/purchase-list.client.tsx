"use client";

import { useId } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useMealPlanner } from "./store";
import { useMutation } from "@tanstack/react-query";
import { use$, useObservable } from "@legendapp/state/react";
import { For } from "@/components/for-each";
import { startCase } from "lodash";
import { useConvexMutation } from "@convex-dev/react-query";
import { api } from "@/convex/_generated/api";
import { toast } from "@/hooks/use-toast";
import type { Id } from "@/convex/_generated/dataModel";

export function ShoppingListDisplay() {
  const { shoppingListData: list } = useMealPlanner();
  const items = list?.items ?? [];

  const groupedItems = Object.groupBy(
    items,
    (item) => item?.ingredient?.category ?? "other",
  );

  const shoppingItems = Object.entries(groupedItems).sort();

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-white dark:bg-neutral-800">
      <ul className="space-y-2">
        <For each={shoppingItems} empty={"empty shopping list"}>
          {([category, categoryItems]) => (
            <div key={category} className="space-y-2">
              <h2 className="capitalize font-bold text-2xl py-2">
                {startCase(category)}
              </h2>
              <For
                each={categoryItems.sort(
                  (a, b) =>
                    a.ingredient?.name.localeCompare(
                      b.ingredient?.name ?? "",
                    ) ?? 0,
                )}
                empty={"no ingredients found"}
              >
                {(item) => (
                  <ShoppingListItem
                    key={item.ingredientId}
                    amount={item.amount}
                    unit={item.ingredient?.unit}
                    name={item.ingredient?.name}
                    isChecked={item.isChecked}
                    id={item._id}
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
  id: Id<"shoppingListItems">;
};

function ShoppingListItem({ amount, unit, name, isChecked, id }: Props) {
  const { currentWeek } = useMealPlanner();

  const uniqueId = useId();
  const labelId = `${uniqueId}-label`;

  const { mutate } = useMutation({
    mutationFn: useConvexMutation(
      api.shoppingList.updateShoppingListItem,
    ).withOptimisticUpdate((localStore, args) => {
      const { checked } = args;

      const weekStart = currentWeek.getTime();

      const currentValue = localStore.getQuery(
        api.shoppingList.getWeeklyShoppingList,
        { weekStart },
      );

      if (currentValue) {
        const updatedItems = currentValue.items.map((item) =>
          item._id === id ? { ...item, isChecked: checked } : item,
        );

        const updatedValue = {
          ...currentValue,
          items: updatedItems,
        };

        localStore.setQuery(
          api.shoppingList.getWeeklyShoppingList,
          { weekStart },
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
    mutate({ checked: !isChecked, shoppingListItemId: id });
  };

  return (
    <li>
      <Label
        htmlFor={uniqueId}
        id={labelId}
        className={cn(
          "flex items-center p-3 justify-between rounded-md border bg-neutral-0 dark:bg-neutral-800 border-neutral-700 shadow-sm transition-colors",
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
