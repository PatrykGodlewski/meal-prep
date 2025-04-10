import { type Ingredient, unitEnum } from "@/supabase/schema";
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
import { Checkbox } from "../ui/checkbox";
import type { UnitType } from "@/validators";

type Props = {
  ingredient: Ingredient;
  index: number;
};

export function IngredientCard({ ingredient, index }: Props) {
  const removeIngredient = (index: number) => {};
  const handleIngredientChange = (
    index: number,
    name: string,
    value: string | boolean,
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
            <Label className="text-sm font-medium">Quantity</Label>
            <Input
              value={ingredient.quantity}
              onChange={(e) =>
                handleIngredientChange(index, "quantity", e.target.value)
              }
              placeholder="e.g., 2"
            />
          </div>

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
                {unitEnum.enumValues.map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Notes</Label>
          <Input
            value={ingredient.notes || ""}
            onChange={(e) =>
              handleIngredientChange(index, "notes", e.target.value)
            }
            placeholder="e.g., finely chopped"
          />
        </div>

        <div className="flex items-center">
          <Checkbox
            id={`optional-${index}`}
            checked={!!ingredient.isOptional}
            onCheckedChange={(checked) =>
              handleIngredientChange(index, "isOptional", !!checked)
            }
          />
          <Label htmlFor={`optional-${index}`} className="ml-2 text-sm">
            Optional ingredient
          </Label>
        </div>
      </div>
    </div>
  );
}
