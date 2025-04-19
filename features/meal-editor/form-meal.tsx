"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { useTransition } from "react";
import {
  type Control,
  useFieldArray,
  useForm,
  useFormContext,
} from "react-hook-form";

import { addMealAction, getAllIngredients } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  INGREDIENT_CATEGORY_ENUM,
  type Ingredient,
  MEAL_CATEGORY_ENUM,
  UNIT_ENUM,
} from "@/supabase/schema";
import { MealAddFormSchema, type MealAddFormValues } from "./validators";
import { BackButton } from "@/components/back-button";

const NEW_INGREDIENT_DEFAULT = {
  id: undefined,
  name: "",
  quantity: 0,
  unit: UNIT_ENUM.enumValues[0],
  category: INGREDIENT_CATEGORY_ENUM.enumValues[0],
  isOptional: false,
  notes: "",
};

const DEFAULT_ADD_VALUES = {
  name: "",
  description: "",
  instructions: "",
  prepTimeMinutes: 0,
  cookTimeMinutes: 0,
  servings: 0,
  category: MEAL_CATEGORY_ENUM.enumValues[1],
  imageUrl: "",
  isPublic: false,
  ingredients: [NEW_INGREDIENT_DEFAULT],
};

type Props = {
  ingredientList: Ingredient[];
};

export default function AddMealForm({ ingredientList }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const { data: availableIngredients = [], isLoading: isLoadingIngredients } =
    useQuery<Ingredient[]>({
      queryKey: ["allIngredients"],
      queryFn: getAllIngredients,
      staleTime: 1000 * 60 * 15,
      refetchOnWindowFocus: false,
      initialData: ingredientList,
    });

  const form = useForm({
    resolver: zodResolver(MealAddFormSchema),
    defaultValues: DEFAULT_ADD_VALUES,
  });
  const { control, setValue } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "ingredients",
  });

  const onSubmit = (values: MealAddFormValues) => {
    startTransition(async () => {
      const result = await addMealAction(values);
      if (result.success && result.mealId) {
        form.reset(DEFAULT_ADD_VALUES);
        router.push(`/meals/${result.mealId}`);
        toast({ title: "Success", description: "Meal added successfully!" });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to add meal.",
          variant: "destructive",
        });
      }
    });
  };

  const handleAddIngredient = () => {
    append(NEW_INGREDIENT_DEFAULT);
  };

  const handleRemoveIngredient = (index: number) => {
    remove(index);
  };

  const populateIngredientData = useCallback(
    (index: number, selectedIngredientId: string | null | undefined) => {
      const selected = availableIngredients.find(
        (ing) => ing.id === selectedIngredientId,
      );
      if (selected) {
        setValue(`ingredients.${index}.id`, selected.id, { shouldDirty: true });
        setValue(`ingredients.${index}.name`, selected.name, {
          shouldDirty: true,
          shouldValidate: true,
        });
        setValue(
          `ingredients.${index}.category`,
          selected.category ?? "other",
          {
            shouldDirty: true,
          },
        );
        setValue(`ingredients.${index}.unit`, selected.unit ?? "g", {
          shouldDirty: true,
        });
      } else {
        setValue(`ingredients.${index}.id`, undefined);
        // Keep typed name, potentially clear unit/category if needed
        // setValue(`ingredients.${index}.category`, null);
        // setValue(`ingredients.${index}.unit`, null);
      }
    },
    [availableIngredients, setValue],
  );

  return (
    <div className="max-w-4xl space-y-4 mx-auto p-4 md:p-6">
      <BackButton />
      <h1 className="text-2xl font-bold mb-6">Add New Meal</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Meal Name and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meal Name*</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter meal name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meal Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a meal category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MEAL_CATEGORY_ENUM.enumValues.map((category) => (
                        <SelectItem
                          key={category}
                          value={category}
                          className="capitalize"
                        >
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Description */}
          <FormField
            control={control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description*</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Brief description of the meal"
                    className="min-h-20"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Instructions */}
          <FormField
            control={control}
            name="instructions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instructions</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Step-by-step instructions..."
                    className="min-h-32"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormDescription>
                  Provide detailed steps for preparing the meal.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Prep Time, Cook Time, Servings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={control}
              name="prepTimeMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prep Time (min)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="15"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? null
                            : Number.parseInt(e.target.value),
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="cookTimeMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cook Time (min)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="30"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? null
                            : Number.parseInt(e.target.value),
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="servings"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Servings</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="4"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? null
                            : Number.parseInt(e.target.value),
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Image URL */}
          <FormField
            control={control}
            name="imageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Image URL</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://example.com/image.jpg"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormDescription>
                  Provide a URL to an image of the meal.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Is Public */}
          <FormField
            control={control}
            name="isPublic"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    id="isPublicCheckbox"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel htmlFor="isPublicCheckbox">
                    Make this meal public
                  </FormLabel>
                  <FormDescription>
                    Public meals can be viewed by other users.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {/* --- Ingredients Section --- */}
          <div className="space-y-6 border-t pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Ingredients*</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddIngredient}
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" /> Add Ingredient
              </Button>
            </div>
            <FormMessage>
              {form.formState.errors.ingredients?.root?.message}
            </FormMessage>

            <div className="space-y-4">
              {fields.map((field, index) => (
                <IngredientInputRow
                  key={field.id}
                  index={index}
                  control={control}
                  availableIngredients={availableIngredients}
                  isLoadingIngredients={isLoadingIngredients}
                  onRemove={() => handleRemoveIngredient(index)}
                  canRemove={fields.length > 1}
                  onSelectIngredient={populateIngredientData}
                />
              ))}
            </div>
          </div>
          {/* --- End Ingredients Section --- */}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Adding Meal..." : "Add Meal"}
          </Button>
        </form>
      </Form>
    </div>
  );
}

interface IngredientInputRowProps {
  index: number;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  control: Control<any>;
  availableIngredients: Ingredient[];
  isLoadingIngredients: boolean;
  onRemove: () => void;
  canRemove: boolean;
  onSelectIngredient: (
    index: number,
    ingredientId: string | null | undefined,
  ) => void;
}

const IngredientInputRow: React.FC<IngredientInputRowProps> = ({
  index,
  control,
  availableIngredients,
  isLoadingIngredients,
  onRemove,
  canRemove,
  onSelectIngredient,
}) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const { watch } = useFormContext<MealAddFormValues>();

  const ingredientId = watch(`ingredients.${index}.id`);
  const ingredientName = watch(`ingredients.${index}.name`);
  const isCreatingNew = useMemo(
    () => !!ingredientName && !ingredientId,
    [ingredientName, ingredientId],
  );
  const selectedUnit = !isCreatingNew
    ? watch(`ingredients.${index}.unit`)
    : undefined;
  const selectedCategory = !isCreatingNew
    ? watch(`ingredients.${index}.category`)
    : undefined;

  return (
    <Card className="p-4 bg-gray-50 dark:bg-neutral-800/50 border dark:border-neutral-700">
      <div className="flex justify-between items-center mb-3">
        <span className="font-medium text-sm text-gray-700 dark:text-gray-300">
          Ingredient #{index + 1}
        </span>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="h-6 w-6 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Remove</span>
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Ingredient Combobox */}
        <FormField
          control={control}
          name={`ingredients.${index}.name`}
          render={({ field }) => (
            <FormItem className="flex flex-col sm:col-span-2 lg:col-span-1">
              <FormLabel className="text-xs">Ingredient*</FormLabel>
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      // role="combobox"
                      aria-expanded={popoverOpen}
                      className={cn(
                        "w-full justify-between font-normal",
                        !field.value && "text-muted-foreground",
                      )}
                      disabled={isLoadingIngredients}
                    >
                      {field.value
                        ? (availableIngredients.find(
                            (ing) => ing.name === field.value,
                          )?.name ?? field.value)
                        : isLoadingIngredients
                          ? "Loading..."
                          : "Select or type..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                  <Command shouldFilter={true}>
                    <CommandInput
                      placeholder="Search or type new..."
                      value={field.value}
                      onValueChange={(search) => {
                        field.onChange(search);
                        const match = availableIngredients.find(
                          (ing) =>
                            ing.name.toLowerCase() === search.toLowerCase(),
                        );
                        if (!match) onSelectIngredient(index, null);
                        else if (watch(`ingredients.${index}.id`) !== match.id)
                          onSelectIngredient(index, match.id);
                      }}
                    />
                    <CommandList>
                      <CommandEmpty>
                        No ingredient found. Type to add new.
                      </CommandEmpty>
                      <CommandGroup>
                        {availableIngredients.map((ing) => (
                          <CommandItem
                            key={ing.id}
                            value={ing.name}
                            onSelect={(currentValue) => {
                              const selected = availableIngredients.find(
                                (i) =>
                                  i.name.toLowerCase() ===
                                  currentValue.toLowerCase(),
                              );
                              field.onChange(
                                selected ? selected.name : currentValue,
                              );
                              onSelectIngredient(index, selected?.id);
                              setPopoverOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                watch(`ingredients.${index}.id`) === ing.id
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            {ing.name} {ing.unit ? `(${ing.unit})` : ""}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormField
                control={control}
                name={`ingredients.${index}.id`}
                render={({ field: idField }) => (
                  <input
                    type="hidden"
                    {...idField}
                    value={idField.value ?? ""}
                  />
                )}
              />
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Quantity */}
        <FormField
          control={control}
          name={`ingredients.${index}.quantity`}
          render={({ field: inputField }) => (
            <FormItem>
              <FormLabel className="text-xs">Quantity*</FormLabel>
              <FormControl>
                <Input {...inputField} placeholder="e.g., 2" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Unit (Conditional) */}
        {isCreatingNew ? (
          <FormField
            control={control}
            name={`ingredients.${index}.unit`}
            render={({ field: inputField }) => (
              <FormItem>
                <FormLabel className="text-xs">Unit</FormLabel>
                <Select
                  value={inputField.value ?? ""}
                  onValueChange={inputField.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {UNIT_ENUM.enumValues.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <FormItem>
            <FormLabel className="text-xs text-gray-500 dark:text-gray-400">
              Unit
            </FormLabel>
            <Input
              readOnly
              disabled
              value={selectedUnit ?? "-"}
              className="bg-gray-100 dark:bg-neutral-700 border-gray-300 dark:border-neutral-600"
            />
          </FormItem>
        )}
        {/* Category (Conditional) */}
        {isCreatingNew ? (
          <FormField
            control={control}
            name={`ingredients.${index}.category`}
            render={({ field: inputField }) => (
              <FormItem>
                <FormLabel className="text-xs">Category</FormLabel>
                <Select
                  value={inputField.value ?? ""}
                  onValueChange={inputField.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {INGREDIENT_CATEGORY_ENUM.enumValues.map((cat) => (
                      <SelectItem key={cat} value={cat} className="capitalize">
                        {cat.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <FormItem>
            <FormLabel className="text-xs text-gray-500 dark:text-gray-400">
              Category
            </FormLabel>
            <Input
              readOnly
              disabled
              value={selectedCategory?.replace(/_/g, " ") ?? "-"}
              className="bg-gray-100 dark:bg-neutral-700 border-gray-300 dark:border-neutral-600 capitalize"
            />
          </FormItem>
        )}
        {/* Notes */}
        <FormField
          control={control}
          name={`ingredients.${index}.notes`}
          render={({ field: inputField }) => (
            <FormItem>
              <FormLabel className="text-xs">Notes</FormLabel>
              <FormControl>
                <Input
                  {...inputField}
                  value={inputField.value ?? ""}
                  placeholder="e.g., finely chopped"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Optional */}
        <FormField
          control={control}
          name={`ingredients.${index}.isOptional`}
          render={({ field: inputField }) => (
            <FormItem className="flex flex-row items-center space-x-2 pt-5">
              <FormControl>
                <Checkbox
                  checked={inputField.value}
                  onCheckedChange={inputField.onChange}
                  id={`ing-opt-${index}`}
                />
              </FormControl>
              <Label
                htmlFor={`ing-opt-${index}`}
                className="text-xs font-normal"
              >
                Optional
              </Label>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </Card>
  );
};
IngredientInputRow.displayName = "IngredientInputRow";
