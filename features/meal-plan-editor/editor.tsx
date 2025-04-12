// components/meal-plan-edit-form.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, parseISO, isValid } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export function MealPlanEditForm({ pageData }: { pageData: any }) {
  const { mealPlan, availableMeals } = pageData;
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EditMealPlanFormValues>({
    resolver: zodResolver(EditMealPlanFormSchema),
    // Initialize form with mapped data
    defaultValues: useMemo(() => mapPageDataToFormValues(pageData), [pageData]),
  });
  const {
    control,
    handleSubmit,
    formState: { isDirty },
  } = form;

  const onSubmit = async (values: EditMealPlanFormValues) => {
    setIsSubmitting(true);
    try {
      // Server action needs to accept this structure (mealPlanId, slots)
      const result = await updateMealPlanAction(values);
      if (result.success) {
        toast({ title: "Success", description: "Meal plan updated." });
        form.reset(values); // Reset dirty state
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update plan.",
          variant: "destructive",
        });
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get the actual days based on the week start date from the form values
  const weekDays = useMemo(() => {
    const startDate = parseISO(form.getValues("date")); // Get date from form state
    return isValid(startDate) ? createBaseWeekStructure(startDate) : [];
  }, [form.watch("date")]); // Watch the date field

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
          {weekDays.map((day) => (
            <Card key={day.date.toISOString()} className="flex flex-col">
              <CardHeader className="p-3 border-b">
                <CardTitle className="text-sm font-medium text-center">
                  {day.dayName}{" "}
                  <span className="text-xs text-muted-foreground ml-1">
                    {format(day.date, "MMM dd")}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-4 flex-grow">
                {mealCategories.map((category) => (
                  <FormField
                    key={category}
                    control={control}
                    // Access nested field: slots.{dayNameLowercase}.{category}.mealId
                    name={`slots.${day.dayName.toLowerCase()}.${category}.mealId`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold capitalize">
                          {category}
                        </FormLabel>
                        <Select
                          value={field.value ?? ""} // Use current mealId or empty string
                          onValueChange={(value) =>
                            field.onChange(value || null)
                          } // Set null if empty value selected
                        >
                          <FormControl>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Select Meal" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {/* Option to clear selection */}
                            <SelectItem value="">-- No Meal --</SelectItem>
                            {/* Filter available meals by category */}
                            {availableMeals
                              .filter(
                                (m) => m.category === category || !m.category,
                              ) // Allow uncategorized or matching
                              .map((meal) => (
                                <SelectItem key={meal.id} value={meal.id}>
                                  {meal.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}
