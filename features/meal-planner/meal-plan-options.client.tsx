"use client";
import { use$ } from "@legendapp/state/react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMealPlanner } from "./store";

export function MealPlanOptions() {
  const { mealPlannerState$ } = useMealPlanner();
  const peopleAmount = use$(mealPlannerState$.peopleAmount);

  return (
    <div className="space-y-4 grid grid-cols-4 border p-8 rounded-xl">
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="people-size">People Size</Label>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Decrease people size"
            onClick={() =>
              mealPlannerState$.peopleAmount.set(Math.max(1, peopleAmount - 1))
            }
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Input
            id="people-size"
            type="number"
            placeholder="e.g. 4"
            value={peopleAmount}
            onChange={(e) =>
              mealPlannerState$.peopleAmount.set(e.target.valueAsNumber)
            }
          />
          <Button
            variant="outline"
            size="icon"
            aria-label="Increase serving size"
            onClick={() => mealPlannerState$.peopleAmount.set(peopleAmount + 1)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
