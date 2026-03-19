"use client";

import { DietShoppingList } from "@/features/diet/DietShoppingList";
import type { DietOutput } from "@/lib/validations/diet";

type Props = {
  diet: DietOutput;
};

export function ShoppingList({ diet }: Props) {
  return <DietShoppingList diet={diet} />;
}
