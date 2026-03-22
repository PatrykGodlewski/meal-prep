"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { INGREDIENT_CATEGORIES, UNITS } from "@/convex/schema";
import { ReplacementsEditor } from "./replacements-editor";

type IngredientWithMeals = FunctionReturnType<
  typeof api.ingredients.queries.getIngredient
>;

const ingredientEditSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.enum(INGREDIENT_CATEGORIES),
  unit: z.enum(UNITS),
  calories: z.coerce.number().min(0, "Calories must be non-negative"),
  replacements: z
    .array(z.object({ ingredientId: z.string(), ratio: z.number().optional() }))
    .optional(),
});

type IngredientEditValues = z.infer<typeof ingredientEditSchema>;

interface IngredientEditFormProps {
  ingredient: NonNullable<IngredientWithMeals>;
  onSuccess?: () => void;
}

export function IngredientEditForm({
  ingredient,
  onSuccess,
}: IngredientEditFormProps) {
  const t = useTranslations("ingredient");
  const tEdit = useTranslations("ingredientEditor");
  const updateIngredient = useMutation(
    api.ingredients.mutations.updateIngredient,
  );
  const allIngredients =
    useQuery(api.ingredients.queries.getIngredients, {}) ?? [];
  const replacementOptions = allIngredients
    .filter((i) => i._id !== ingredient._id)
    .map((i) => ({ label: i.name, value: i._id }));

  const replacementInfos = (
    ingredient as { replacementInfos?: { name: string; ratio: number }[] }
  ).replacementInfos;
  const initialReplacements =
    (
      ingredient as {
        replacements?: { ingredientId: string; ratio?: number }[];
      }
    ).replacements ??
    (ingredient as { replacementIds?: string[] }).replacementIds?.map((id) => ({
      ingredientId: id,
      ratio: 1,
    })) ??
    replacementInfos
      ?.map((r, _i) => ({
        ingredientId: allIngredients.find((a) => a.name === r.name)?._id ?? "",
        ratio: r.ratio,
      }))
      .filter((r) => r.ingredientId) ??
    [];

  const form = useForm<IngredientEditValues>({
    resolver: zodResolver(ingredientEditSchema),
    defaultValues: {
      name: ingredient.name,
      category: ingredient.category ?? "other",
      unit: ingredient.unit ?? "g",
      calories: ingredient.calories ?? 0,
      replacements: initialReplacements,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await updateIngredient({
        ingredientId: ingredient._id,
        name: values.name.trim(),
        category: values.category,
        unit: values.unit,
        calories: values.calories,
        replacements: (values.replacements ?? []).map((r) => ({
          ingredientId: r.ingredientId as Id<"ingredients">,
          ratio: r.ratio,
        })),
      });
      toast.success(tEdit("updateSuccess"));
      form.reset(values);
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : tEdit("updateError"),
      );
    }
  });

  const isPending = form.formState.isSubmitting;

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow-md dark:bg-neutral-900">
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-6 p-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{tEdit("nameLabel")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={tEdit("namePlaceholder")}
                    className="font-bold text-xl"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tEdit("categoryLabel")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={tEdit("categoryPlaceholder")}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {INGREDIENT_CATEGORIES.map((cat) => (
                        <SelectItem
                          key={cat}
                          value={cat}
                          className="capitalize"
                        >
                          {t(cat)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tEdit("unitLabel")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={tEdit("unitPlaceholder")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {UNITS.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {t(unit)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="calories"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tEdit("caloriesLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      {...field}
                      placeholder={tEdit("caloriesPlaceholder")}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ""
                            ? 0
                            : Number.parseInt(e.target.value, 10),
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="replacements"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{tEdit("replacementsLabel")}</FormLabel>
                <FormControl>
                  <ReplacementsEditor
                    value={field.value ?? []}
                    onChange={field.onChange}
                    options={replacementOptions}
                    placeholder={tEdit("replacementsPlaceholder")}
                    emptyOptionsMessage={tEdit("replacementsNoOptions")}
                  />
                </FormControl>
                <p className="text-muted-foreground text-sm">
                  {replacementOptions.length === 0
                    ? tEdit("replacementsNoOptions")
                    : tEdit("replacementsHelp")}
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-2">
            <Button
              type="submit"
              disabled={isPending || !form.formState.isDirty}
            >
              {isPending ? tEdit("saving") : tEdit("saveChanges")}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
