import { observable } from "@legendapp/state";
import {
  configureSyncedSupabase,
  syncedSupabase,
} from "@legendapp/state/sync-plugins/supabase";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@/utils/supabase/client";
import { useObservable } from "@legendapp/state/react";
import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage";

const supabase = createClient();

configureSyncedSupabase({
  generateId: () => uuidv4(),
  changesSince: "last-sync",
  fieldCreatedAt: "createdAt",
  fieldUpdatedAt: "updatedAt",
});

export async function useShoppingList(listId: string) {
  if (!listId) throw new Error("listId is required");

  console.log(`Creating synced observable for shoppingListId: ${listId}`);

  const listItems$ = useObservable(
    syncedSupabase({
      supabase,
      collection: "shoppingListItems",
      filter: (select) => select.eq("shoppingListId", listId),
      actions: ["read", "update"],
      realtime: { schema: "public", filter: `shoppingListId=eq.${listId}` },
      persist: {
        name: `shoppingListItems_${listId}`,
        retrySync: true,
        plugin: ObservablePersistLocalStorage,
      },
    }),
  );

  const updateItemChecked = (itemId: string, checked: boolean) => {
    if (listItems$[itemId]) {
      listItems$[itemId].isChecked.set(checked);
    } else {
      console.warn(
        `Item with id ${itemId} not found in observable for list ${listId}.`,
      );
    }
  };

  const listItems = listItems$.get();

  return {
    listItems,
    updateItemChecked,
  };
}
