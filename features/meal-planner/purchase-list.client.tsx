"use client";

import { useId } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useMealPlanner } from "./store";
import { useMutation } from "@tanstack/react-query";
import { use$, useObservable } from "@legendapp/state/react";
import {
  updateShoppingListItemCheck,
  type WeeklyShoppingList,
} from "./actions";
import { For } from "@/components/for-each";
import { startCase } from "lodash";

export function ShoppingListDisplay() {
  const { shoppingListData: list } = useMealPlanner();
  const items = list?.items ?? [];

  // https://github.com/LegendApp/legend-state/issues/476
  // implement this to tanstack query as initial data or something
  // const { updateItemChecked, listItems } = useShoppingList(listId);
  // const items = Object.values(listItems);

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
                  <ShoppingListItem key={item.ingredientId} item={item} />
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
  item: WeeklyShoppingList["items"][number];
};

function ShoppingListItem({ item }: Props) {
  // export to useMealPlanner and add reset or something like that
  const checked$ = useObservable(item.isChecked);
  const checked = use$(checked$);
  const uniqueId = useId();
  const labelId = `${uniqueId}-label`;

  const { mutate, isPending } = useMutation({
    mutationKey: ["shopping-list-item", item.id],
    mutationFn: (isChecked: boolean) =>
      updateShoppingListItemCheck(item.id, isChecked),
    onSuccess: (data) => {
      checked$.set(data.success ? !checked : checked);
    },
  });

  const handleCheckChange = () => {
    mutate(!checked);
  };

  return (
    <li>
      <Label
        htmlFor={uniqueId}
        id={labelId}
        className={cn(
          "flex items-center p-3 justify-between rounded-md border bg-neutral-0 dark:bg-neutral-800 border-neutral-700 shadow-sm transition-colors",
          isPending
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-neutral-100 dark:hover:bg-neutral-700/50 cursor-pointer",
        )}
      >
        <div className="flex items-center gap-2">
          <Checkbox
            id={uniqueId}
            checked={checked}
            onCheckedChange={handleCheckChange}
            aria-labelledby={labelId}
          />
          <span
            className={cn("text-sm font-medium", {
              "cursor-pointer": !isPending,
              "line-through text-neutral-500": checked,
            })}
          >
            {item.ingredient?.name}
          </span>
        </div>
        <span
          className={cn("text-sm italic", {
            "text-gray-400": checked,
          })}
        >
          {item.amount} {item.ingredient?.unit}
        </span>
      </Label>
    </li>
  );
}
