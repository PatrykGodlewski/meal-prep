import { UNIT_ENUM, type Ingredient } from "@/supabase/schema";
import { Button } from "../ui/button";
import { X } from "lucide-react";
import { Label } from "@radix-ui/react-label";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import type { UnitType } from "@/validators";

type Props = {
  ingredient: Ingredient;
  index: number;
};

export function IngredientCard({ ingredient, index }: Props) {
  const removeIngredient = (_index: number) => {};
  const handleIngredientChange = (
    _index: number,
    _name: string,
    _value: string | boolean,
  ) => {};
  // TODO: add to meal details
  return (
    <div key={ingredient.id} className="border rounded-md p-3 bg-background">
      <div className="flex justify-between mb-2">
        <span className="font-medium">Ingredient #{index + 1}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => removeIngredient(index)}
          className="h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Remove</span>
        </Button>
      </div>

      <div className="space-y-2">
        <div>
          <Label className="text-sm font-medium">Name</Label>
          <Input
            value={ingredient.name}
            onChange={(e) =>
              handleIngredientChange(index, "name", e.target.value)
            }
            placeholder="e.g., Flour"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-sm font-medium">Unit</Label>
            <Select
              value={ingredient.unit || ""}
              onValueChange={(value) =>
                handleIngredientChange(index, "unit", value as UnitType)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {UNIT_ENUM.enumValues.map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
