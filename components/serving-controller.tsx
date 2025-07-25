"use client";
import { Minus, Plus } from "lucide-react";
import { useMealPlanner } from "@/features/meal-planner/store";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export default function ServingController() {
  const { servings$, servings } = useMealPlanner();
  return (
    <div className="flex items-center space-x-2 w-48">
      <Button
        variant="outline"
        size="icon"
        aria-label="Decrease people size"
        onClick={() => servings$.set(Math.max(1, servings - 1))}
      >
        <Minus className="size-4" />
      </Button>
      <Input
        id="people-size"
        type="number"
        placeholder="e.g. 4"
        value={servings}
        onChange={(e) => servings$.set(e.target.valueAsNumber)}
      />
      <Button
        variant="outline"
        size="icon"
        aria-label="Increase serving size"
        onClick={() => servings$.set(servings + 1)}
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}
