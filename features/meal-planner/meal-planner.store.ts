import { createClient } from "@/utils/supabase/client";
import { observable } from "@legendapp/state";
import {
  configureSyncedSupabase,
  syncedSupabase,
} from "@legendapp/state/sync-plugins/supabase";
import { v4 as uuidv4 } from "uuid";

const supabase = createClient();

const generateId = () => uuidv4();

configureSyncedSupabase({
  generateId,
});

const uid = "";

const messages$ = observable(
  syncedSupabase({
    supabase,
    collection: "shoppingListItems",
    select: (from) => from.select("*"),
    // Filter by the current user
    filter: (select) => select.eq("shoppingListId", uid),
    // Don't allow delete
    actions: ["update"],
    // Realtime filter by user_id
    realtime: { filter: `shoppingListId=eq.${uid}` },
    // Persist data and pending changes locally
    persist: { name: "shopping_list_items", retrySync: true },
    // Sync only diffs
    changesSince: "last-sync",
  }),
);

// get() activates and starts syncing
const messages = messages$.get();

function addMessage(text: string) {
  const id = generateId();
  // Add keyed by id to the messages$ observable to trigger a create in Supabase
  messages$[id].set({
    id,
    created_at: null,
    updated_at: null,
  });
}

function updateMessage(id: string, text: string) {
  // Just set values in the observable to trigger an update to Supabase
  messages$[id].text.set(text);
}
