"use client";

import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { useTranslations } from "next-intl";
import { Loader2, Trash2 } from "lucide-react";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

type FridgeItemData = {
  _id: Id<"fridgeItems">;
  ingredientId: Id<"ingredients">;
  amount: number;
  ingredient: {
    name: string;
    unit?: string;
  } | null;
};

type Props = {
  item: FridgeItemData;
  onUpdate?: () => void;
};

export function FridgeItem({ item, onUpdate }: Props) {
  const [editValue, setEditValue] = useState<string | null>(null);
  const t = useTranslations("fridge");
  const tIngredient = useTranslations("ingredient");

  const { mutate: updateItem, isPending: isUpdating } = useMutation({
    mutationFn: useConvexMutation(api.fridge.updateFridgeItem),
    onSuccess: () => {
      setEditValue(null);
      onUpdate?.();
    },
    onError: (error) => {
      toast.error(t("updateError"));
      console.error(error);
    },
  });

  const { mutate: removeItem, isPending: isRemoving } = useMutation({
    mutationFn: useConvexMutation(api.fridge.removeFridgeItem),
    onSuccess: () => onUpdate?.(),
    onError: (error) => {
      toast.error(t("removeError"));
      console.error(error);
    },
  });

  const handleBlur = useCallback(() => {
    const raw = editValue ?? String(item.amount);
    const v = parseFloat(raw);
    if (Number.isNaN(v) || v <= 0) {
      setEditValue(null);
      return;
    }
    if (Math.abs(v - item.amount) > 0.001) {
      updateItem({ fridgeItemId: item._id, amount: v });
    } else {
      setEditValue(null);
    }
  }, [editValue, item._id, item.amount, updateItem]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Escape") {
      if (e.key === "Escape") setEditValue(null);
      (e.target as HTMLInputElement).blur();
    }
  }, []);

  const unit = item.ingredient?.unit ?? "piece";
  const unitLabel = tIngredient(unit as never) || unit;
  const isBusy = isUpdating || isRemoving;

  return (
    <li
      className={cn(
        "group flex items-center justify-between gap-4 rounded-lg border bg-card p-4 shadow-sm transition-colors",
        "hover:bg-muted/50",
        isBusy && "opacity-70",
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium truncate">
          {item.ingredient?.name ?? "Unknown"}
        </p>
        <p className="text-muted-foreground text-sm">{unitLabel}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div className="relative">
          <Input
            type="number"
            min={0.01}
            step={0.5}
            value={editValue ?? item.amount}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onFocus={() => setEditValue(String(item.amount))}
            onKeyDown={handleKeyDown}
            className="h-10 w-24 text-right tabular-nums pr-8"
            disabled={isBusy}
            aria-label={`${item.ingredient?.name ?? "Item"} amount`}
          />
          {isUpdating && (
            <div
              className="absolute top-1/2 right-2 -translate-y-1/2"
              aria-hidden
            >
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={() => removeItem({ fridgeItemId: item._id })}
          disabled={isBusy}
          aria-label={t("remove")}
          title={t("remove")}
        >
          {isRemoving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </div>
    </li>
  );
}
