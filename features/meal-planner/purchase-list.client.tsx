// components/shopping-list-display.tsx (New file or rename existing)
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import convertKeysToCamelCase, { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client"; // Supabase client
import { useToast } from "@/hooks/use-toast";
import type { ShoppingListItem } from "@/supabase/schema"; // DB type for items
import {
  updateShoppingListItemCheck,
  updateWeeklyShoppingList,
  type WeeklyShoppingList,
} from "./actions";
import { Button } from "@/components/ui/button";
import {
  REALTIME_LISTEN_TYPES,
  REALTIME_POSTGRES_CHANGES_LISTEN_EVENT,
} from "@supabase/supabase-js";

interface ShoppingListDisplayProps {
  list: WeeklyShoppingList;
  currentWeek: Date;
}

export const ShoppingListDisplay: React.FC<ShoppingListDisplayProps> = ({
  list,
  currentWeek,
}) => {
  const initialItems = list?.items;
  const shoppingListId = list?.id;
  const supabase = createClient();
  const { toast } = useToast();
  const [items, setItems] = useState<WeeklyShoppingList["items"]>(initialItems);
  const [isLoading, setIsLoading] = useState(false); // Basic loading state for updates

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  useEffect(() => {
    // Only subscribe if we have a valid list ID
    if (!shoppingListId) return;

    const channel = supabase
      .channel(`shopping_list_items_${shoppingListId}`)
      .on<ShoppingListItem>(
        REALTIME_LISTEN_TYPES.POSTGRES_CHANGES,
        {
          event: REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.ALL,
          schema: "public",
          table: "shopping_list_items",
          // filter: `shopping_list_id=eq.${shoppingListId}`, // Filter for this list
        },
        (payload) => {
          console.log("Realtime Change received:", payload);
          const newItem = convertKeysToCamelCase(payload.new);
          setItems((currentItems) => {
            let newItems = [...currentItems];
            switch (payload.eventType) {
              case "INSERT":
                // Avoid duplicates if optimistic update already added it
                if (!newItems.some((item) => item.id === payload.new.id)) {
                  newItems.push(newItem as WeeklyShoppingList["items"][number]);
                }
                break;
              case "UPDATE":
                newItems = newItems.map((item) =>
                  item.id === payload.new.id ? { ...item, ...newItem } : item,
                );
                console.log(newItems);
                break;
              case "DELETE":
                newItems = newItems.filter(
                  (item) => item.id !== payload.old.id,
                );
                break;
            }
            // Optional: Sort items after update
            // newItems.sort((a, b) => a.ingredientName.localeCompare(b.ingredientName));
            return newItems;
          });
        },
      )
      .subscribe((status, err) => {
        console.log({ status, err });
        if (status === "SUBSCRIBED") {
          console.log(`Realtime subscribed for list: ${shoppingListId}`);
        }
        if (err) {
          console.error(
            `Realtime subscription error for list ${shoppingListId}:`,
            err,
          );
          toast({
            title: "Realtime Error",
            description: "Problem connecting to live updates.",
            variant: "destructive",
          });
        }
      });

    // Cleanup
    return () => {
      console.log(`Unsubscribing from list: ${shoppingListId}`);
      supabase.removeChannel(channel);
    };
  }, [shoppingListId, supabase, toast]); // Re-subscribe if listId changes

  const handleCheckChange = useCallback(
    async (itemId: string, currentCheckedStatus: boolean) => {
      const newCheckedStatus = !currentCheckedStatus;
      setIsLoading(true); // Indicate activity

      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === itemId ? { ...item, isChecked: newCheckedStatus } : item,
        ),
      );

      try {
        const result = await updateShoppingListItemCheck(
          itemId,
          newCheckedStatus,
        );
        if (!result.success) {
          toast({
            title: "Update Failed",
            description: result.error || "Could not update item.",
            variant: "destructive",
          });
          setItems((currentItems) =>
            currentItems.map((item) =>
              item.id === itemId
                ? { ...item, isChecked: currentCheckedStatus }
                : item,
            ),
          );
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to save check state.",
          variant: "destructive",
        });
        setItems((currentItems) =>
          currentItems.map((item) =>
            item.id === itemId
              ? { ...item, isChecked: currentCheckedStatus }
              : item,
          ),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [toast],
  ); // Removed server action dependency as it's stable

  // --- Render Logic ---
  const renderContent = () => {
    // Note: isLoading here refers to the checkbox update, not initial load
    // Initial load state should be handled by the parent component passing initialItems

    if (items.length === 0) {
      return (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic p-4 text-center">
          Shopping list is empty.
        </p>
      );
    }

    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    const groupedItems = useMemo(() => {
      return Object.groupBy(
        items,
        (item) => item?.ingredient?.category ?? "other",
      );
    }, [items]);

    return (
      <ul className="space-y-2">
        {Object.entries(groupedItems)
          .sort()
          .map(([category, items]) => (
            <div key={category} className="space-y-2">
              <h2 className="capitalize font-bold text-2xl py-2">{category}</h2>
              {items.map((item) => {
                const uniqueId = `shopping-item-${item.id}`;
                return (
                  // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
                  <li
                    key={item.id}
                    className="flex items-center p-3 justify-between rounded-md border bg-white dark:bg-neutral-800/50 dark:border-neutral-700 shadow-sm hover:bg-gray-50 dark:hover:bg-neutral-700/50 transition-colors"
                    onClick={() => handleCheckChange(item.id, item.isChecked)}
                  >
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id={uniqueId}
                        checked={item.isChecked}
                        onCheckedChange={() =>
                          handleCheckChange(item.id, item.isChecked)
                        }
                        aria-labelledby={`${uniqueId}-label`}
                        disabled={isLoading}
                      />
                      <Label
                        htmlFor={uniqueId}
                        id={`${uniqueId}-label`}
                        className={cn(
                          "text-sm font-medium cursor-pointer",
                          item.isChecked
                            ? "line-through text-gray-500 dark:text-gray-400"
                            : "text-gray-800 dark:text-gray-100",
                        )}
                      >
                        {item.ingredientName}
                      </Label>
                    </div>
                    <span
                      className={cn(
                        "text-sm italic",
                        item.isChecked
                          ? "text-gray-400 dark:text-gray-500"
                          : "text-gray-600 dark:text-gray-300",
                      )}
                    >
                      {item.amount} {item.ingredient?.unit}
                    </span>
                  </li>
                );
              })}
            </div>
          ))}
      </ul>
    );
  };

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-white dark:bg-neutral-800">
      <div className="flex items-center justify-between mb-4 pb-2">
        <h3 className="text-lg font-semibold ">{"Shopping list"}</h3>
        <Button onClick={() => updateWeeklyShoppingList(currentWeek)}>
          {"Update shopping list"}
        </Button>
      </div>
      {shoppingListId ? renderContent() : "No shopping list created"}
    </div>
  );
};
