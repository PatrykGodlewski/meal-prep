"use client";

import { useConvexMutation } from "@convex-dev/react-query";
import { use$ } from "@legendapp/state/react";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { camelCase } from "lodash";
import { ChevronRight, Eye, EyeOff, ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId } from "react";
import { toast } from "sonner";
import { For } from "@/components/for-each";
import ServingController from "@/components/serving-controller";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import type { IngredientCategory } from "@/validators";
import { DatePickerWithPresets } from "./date-picker";
import { useMealPlanner } from "./store";

const LIDL_LAYOUT: (IngredientCategory | undefined)[] = [
  "grain",
  "fruit",
  "vegetable",

  "nut_seed",
  "spice_herb",

  "meat",
  "poultry",

  "fat_oil",
  "condiment",
  "legume",

  "baking",
  "sweetener",

  "dairy",
  "seafood",
  "beverage",

  "other",
  undefined,
];

export function ShoppingListDisplay() {
  const { shoppingListData: list, hideCheckedShoppingListItems$ } =
    useMealPlanner();
  const isHiddenCheckedItems = use$(hideCheckedShoppingListItems$);
  const t = useTranslations("mealPlanner");
  const tMeal = useTranslations("meal");
  const tIngredient = useTranslations("ingredient");

  const items = list?.items ?? [];

  const groupedItems = Object.groupBy(
    items,
    (item) => item?.ingredient?.category ?? "other",
  );

  const shoppingItems = Object.entries(groupedItems).sort(([catA], [catB]) => {
    const indexA = LIDL_LAYOUT.indexOf(catA as IngredientCategory);
    const indexB = LIDL_LAYOUT.indexOf(catB as IngredientCategory);

    if (indexA === -1 || indexB === -1) {
      return 0;
    }

    return indexA - indexB;
  });

  return (
    <div className="min-h-[500px] rounded-lg border bg-white p-4 shadow-xs transition-colors duration-700 ease-in hover:bg-neutral-100/75 dark:bg-neutral-950/75 dark:hover:bg-neutral-900">
      <div
        className={"flex flex-col flex-wrap justify-between gap-4 md:flex-row"}
      >
        <h1 className="flex items-center gap-3 font-bold text-3xl">
          <ShoppingCart />
          {t("shoppingList")}
        </h1>
        <Button
          onClick={() => {
            hideCheckedShoppingListItems$.set((prev) => !prev);
          }}
        >
          {isHiddenCheckedItems ? <EyeOff /> : <Eye />}
        </Button>
        <ServingController />
        <DatePickerWithPresets />
      </div>
      <Separator className="my-2" />
      <ul className="space-y-2">
        <For each={shoppingItems} empty={t("emptyShoppingList")}>
          {([category, categoryItems]) => {
            const sortedCategoryItems = categoryItems.sort(
              (a, b) =>
                a.ingredient?.name.localeCompare(b.ingredient?.name ?? "") ?? 0,
            );

            return (
              <div key={category} className="space-y-2">
                <h2 className="py-2 font-bold text-2xl capitalize">
                  {tIngredient(camelCase(category))}
                </h2>
                <For each={sortedCategoryItems} empty={t("noIngredients")}>
                  {(item) => (
                    <ShoppingListItem
                      key={item.ingredientId}
                      amount={item.amount}
                      unit={item.ingredient?.unit}
                      name={item.ingredient?.name}
                      isChecked={item.isChecked}
                      ids={item.itemIds}
                      mealBreakdown={item.mealBreakdown ?? []}
                      existingAmountUsed={item.existingAmountUsed}
                      tMeal={tMeal}
                      tPlanner={t}
                    />
                  )}
                </For>
              </div>
            );
          }}
        </For>
      </ul>
    </div>
  );
}

type MealBreakdownItem = {
  mealName: string;
  category: string;
  planDate: number;
  quantity: number;
};

type Props = {
  amount: number;
  unit?: string;
  name?: string;
  isChecked: boolean;
  ids: Id<"shoppingListItems">[];
  mealBreakdown: MealBreakdownItem[];
  existingAmountUsed?: number;
  tMeal: (key: string) => string;
  tPlanner: (key: string) => string;
};

function ShoppingListItem({
  amount,
  unit,
  name,
  isChecked,
  ids,
  mealBreakdown,
  existingAmountUsed,
  tMeal,
  tPlanner,
}: Props) {
  const { mealPlannerState$, hideCheckedShoppingListItems$, servings } =
    useMealPlanner();

  const shouldHideItem = use$(hideCheckedShoppingListItems$);

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
      toast("Error", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred.",
      });
    },
  });

  const handleCheckChange = () => {
    mutate({ checked: !isChecked, shoppingListItemIds: ids });
  };

  if (shouldHideItem && isChecked) {
    return null;
  }

  const hasMealBreakdown = mealBreakdown.length > 0;
  const isPartial = existingAmountUsed != null && existingAmountUsed > 0;

  return (
    <li>
      <Collapsible className="group/collapsible">
        <div
          className={cn(
            "flex items-center justify-between gap-2 rounded-md border p-3 shadow-xs transition-colors",
            isPartial
              ? "border-yellow-500 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-950/30"
              : "border-neutral-700 bg-neutral-0 dark:border-neutral-950 dark:bg-neutral-950",
            "hover:bg-neutral-100 dark:hover:bg-neutral-800",
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Checkbox
              id={uniqueId}
              checked={isChecked}
              onCheckedChange={handleCheckChange}
              aria-labelledby={labelId}
            />
            <Label
              htmlFor={uniqueId}
              id={labelId}
              className={cn(
                "flex min-w-0 flex-1 cursor-pointer font-medium text-sm",
                {
                  "text-neutral-500 line-through": isChecked,
                },
              )}
            >
              <span className="truncate">{name}</span>
            </Label>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-0.5">
            <span
              className={cn("text-sm italic", {
                "text-gray-400": isChecked,
                "text-yellow-700 dark:text-yellow-400": isPartial && !isChecked,
              })}
            >
              {servings * amount} {unit}
            </span>
            {isPartial && !isChecked && (
              <span className="text-xs text-yellow-700 dark:text-yellow-400">
                {tPlanner("partialAmountNote")}
              </span>
            )}
          </div>
          {hasMealBreakdown && (
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="shrink-0 rounded p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                aria-label={tPlanner("showMealBreakdown")}
              >
                <ChevronRight className="size-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
              </button>
            </CollapsibleTrigger>
          )}
        </div>
        {hasMealBreakdown && (
          <CollapsibleContent>
            <div className="mt-1 ml-8 space-y-1 border-neutral-200 border-l-2 py-1 pl-3 dark:border-neutral-700">
              <p className="font-medium text-muted-foreground text-xs">
                {tPlanner("forMeals")}:
              </p>
              {mealBreakdown.map((entry, idx) => (
                <div
                  key={`${entry.mealName}-${entry.category}-${entry.planDate}-${idx}`}
                  className="flex flex-wrap items-center gap-x-2 gap-y-0 text-muted-foreground text-xs"
                >
                  <span className="font-medium text-foreground">
                    {entry.mealName}
                  </span>
                  <span>
                    ({tMeal(entry.category as never)} •{" "}
                    {format(entry.planDate, "EEE")})
                  </span>
                  <span>
                    {servings * entry.quantity} {unit}
                  </span>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        )}
      </Collapsible>
    </li>
  );
}
