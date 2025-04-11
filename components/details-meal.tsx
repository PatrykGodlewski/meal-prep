// components/details-meal.tsx (or wherever MealDetailView lives)
"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Edit, Save, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Form } from "@/components/ui/form"; // Import RHF Form provider
import type { Ingredient, Meal } from "@/supabase/schema"; // Adjust path
import { deleteMeal, updateMeal } from "@/app/actions"; // Ensure path is correct
import { MealDisplayDetails } from "@/features/meal-editor/meal-display-details"; // Import Display component
import {
  MealEditForm,
  MealFormSchema,
  type MealUpdateFormValues,
} from "@/features/meal-editor/meal-editor-form"; // Import Edit Form component and schema/type

// --- Prop Types ---
type MealWithDetails = Meal & {
  ingredients: Ingredient[];
  authorName: string;
};

interface MealDetailViewProps {
  meal: MealWithDetails;
}

// --- Main Controller Component ---
export default function MealDetailView({ meal }: MealDetailViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- React Hook Form Setup ---
  // Initialize form here to manage state across views and for reset
  const form = useForm({
    resolver: zodResolver(MealFormSchema),
    // Memoize default values based on the meal prop
    defaultValues: useMemo(
      () => ({
        id: meal.id, // Ensure ID is included
        name: meal.name,
        description: meal.description,
        prepTimeMinutes: meal.prepTimeMinutes ?? undefined,
        cookTimeMinutes: meal.cookTimeMinutes ?? undefined,
        servings: meal.servings ?? undefined,
        category: meal.category ?? undefined,
        imageUrl: meal.imageUrl ?? "",
        instructions: meal.instructions ?? "",
        isPublic: meal.isPublic ?? false,
        ingredients: meal.ingredients.map((ing) => ({
          id: ing.id, // Keep existing ID
          mealId: ing.mealId,
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit ?? null,
          category: ing.category ?? null,
          isOptional: ing.isOptional ?? false,
          notes: ing.notes ?? "",
        })),
      }),
      [meal],
    ),
  });

  // Effect to reset form if meal prop changes *while not editing*
  useEffect(() => {
    if (!isEditing) {
      form.reset({
        // Reset to the potentially updated meal prop
        id: meal.id,
        name: meal.name,
        description: meal.description,
        prepTimeMinutes: meal.prepTimeMinutes ?? undefined,
        cookTimeMinutes: meal.cookTimeMinutes ?? undefined,
        servings: meal.servings ?? undefined,
        category: meal.category ?? undefined,
        imageUrl: meal.imageUrl ?? "",
        instructions: meal.instructions ?? "",
        isPublic: meal.isPublic ?? false,
        ingredients: meal.ingredients.map((ing) => ({
          id: ing.id,
          mealId: ing.mealId,
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit ?? null,
          category: ing.category ?? null,
          isOptional: ing.isOptional ?? false,
          notes: ing.notes ?? "",
        })),
      });
    }
  }, [meal, isEditing, form]);
  // --- End Form Setup ---

  // --- Event Handlers ---
  const toggleEditMode = () => {
    const nextIsEditing = !isEditing;
    setIsEditing(nextIsEditing);
    if (!nextIsEditing) {
      form.reset(); // Reset to defaultValues (which are based on original meal) on cancel
    }
  };

  const onSubmit = async (values: MealUpdateFormValues) => {
    setIsSubmitting(true);
    try {
      const result = await updateMeal(values); // Pass validated form values
      if (result.success) {
        toast({ title: "Success", description: "Meal updated successfully" });
        setIsEditing(false);
        // Server action's revalidate should handle data refresh
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update meal",
          variant: "destructive",
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setIsSubmitting(true);
    try {
      const result = await deleteMeal(meal.id);
      if (result.success) {
        toast({ title: "Success", description: "Meal deleted successfully" });
        router.push("/meals");
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete meal",
          variant: "destructive",
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred";
      toast({ title: "Error", description: message, variant: "destructive" });
      setIsSubmitting(false);
    }
  };
  // --- End Event Handlers ---

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header Buttons */}
      <div className="flex justify-between items-center mb-6">
        <Button onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Go back
        </Button>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={toggleEditMode}
                disabled={isSubmitting}
              >
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
              {/* Trigger RHF submit */}
              <Button
                onClick={form.handleSubmit(onSubmit)}
                disabled={isSubmitting || !form.formState.isDirty}
              >
                <Save className="h-4 w-4 mr-1" />{" "}
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={toggleEditMode}>
              <Edit className="h-4 w-4 mr-1" /> Edit Meal
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isSubmitting}>
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isSubmitting}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteConfirm}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* --- Conditional Rendering of View or Edit --- */}
      {isEditing ? (
        // Provide form context and render edit form
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <MealEditForm />
            {/* Save button is outside the form component, but triggered by form's handleSubmit */}
          </form>
        </Form>
      ) : (
        // Render display component
        <MealDisplayDetails meal={meal} />
      )}
      {/* --- End Conditional Rendering --- */}
    </div>
  );
}
