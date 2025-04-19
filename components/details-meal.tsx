// components/details-meal.tsx
"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
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
import { Form } from "@/components/ui/form";
// Base DB types might not be strictly needed if MealDetails is comprehensive
// import type { Ingredient, Meal, MealIngredient } from "@/supabase/schema";
import { deleteMeal, updateMeal } from "@/app/actions";
import {
  MealEditForm,
  MealFormSchema, // Use the schema defined in MealEditForm
  type MealUpdateFormValues, // Use the type defined in MealEditForm
} from "@/features/meal-editor/meal-editor-form"; // Adjust path
import { MealDisplayDetails } from "@/features/meal-editor/meal-display-details"; // Adjust path
import type { MealDetails } from "@/app/meals/[id]/page"; // Import the specific type from the server component
import type { Ingredient } from "@/supabase/schema";
import { BackButton } from "./back-button";

// --- Prop Types ---
interface MealDetailViewProps {
  pageData: MealDetails;
  ingredientList: Ingredient[];
}

// --- Helper Function ---
/**
 * Maps the fetched MealDetails data structure to the structure
 * required by the MealUpdateFormValues (Zod schema type).
 */
const mapPageDataToFormValues = (
  pageData: MealDetails | null | undefined, // Accept potentially null/undefined input
): MealUpdateFormValues | undefined => {
  if (!pageData) return undefined; // Return undefined if no data

  const { mealIngredients, ...mealData } = pageData; // Separate meal base data

  const formIngredients = (mealIngredients || []) // Handle potentially undefined mealIngredients
    .filter((mi) => mi.ingredient !== null) // Process only valid links
    .map((mi) => {
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      const ingredient = mi.ingredient!; // Safe due to filter
      return {
        id: ingredient.id, // Ingredient definition ID
        name: ingredient.name,
        category: ingredient.category ?? "other",
        unit: ingredient.unit ?? "g",
        quantity: mi.quantity, // From junction record
        isOptional: mi.isOptional ?? false, // From junction record
        notes: mi.notes ?? "", // From junction record
      };
    });

  // Map the main meal data
  return {
    id: mealData.id,
    name: mealData.name,
    description: mealData.description,
    prepTimeMinutes: mealData.prepTimeMinutes ?? undefined,
    cookTimeMinutes: mealData.cookTimeMinutes ?? undefined,
    servings: mealData.servings ?? undefined,
    category: mealData.category ?? "lunch",
    imageUrl: mealData.imageUrl ?? "",
    instructions: mealData.instructions ?? "",
    isPublic: mealData.isPublic ?? false,
    ingredients: formIngredients,
  };
};

export default function MealDetailView({
  pageData,
  ingredientList,
}: MealDetailViewProps) {
  const authorName = "Unknown Author"; // Placeholder - Fetch this in the server component if needed
  const router = useRouter();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- React Hook Form Setup ---
  const form = useForm({
    resolver: zodResolver(MealFormSchema),
    defaultValues: useMemo(
      () => mapPageDataToFormValues(pageData), // Use helper, provide empty object fallback
      [pageData], // Recalculate only when pageData changes
    ),
  });

  // Effect to reset form if pageData prop changes *while not editing*
  useEffect(() => {
    if (!isEditing) {
      form.reset(mapPageDataToFormValues(pageData));
    }
  }, [pageData, isEditing, form]);
  // --- End Form Setup ---

  // --- Event Handlers ---
  const toggleEditMode = useCallback(() => {
    setIsEditing((prev) => {
      if (prev) form.reset(); // Reset on cancel
      return !prev;
    });
  }, [form]);

  const onSubmit = useCallback(
    async (values: MealUpdateFormValues) => {
      setIsSubmitting(true);
      try {
        const result = await updateMeal(values);
        if (result.success) {
          toast({ title: "Success", description: "Meal updated successfully" });
          setIsEditing(false);
        } else {
          toast({
            title: "Error",
            description: result.error || "Update failed",
            variant: "destructive",
          });
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred";
        toast({ title: "Error", description: message, variant: "destructive" });
      } finally {
        setIsSubmitting(false);
      }
    },
    [toast],
  );

  const handleDeleteConfirm = useCallback(async () => {
    // Ensure pageData and meal id exist before attempting delete
    if (!pageData?.id) {
      toast({
        title: "Error",
        description: "Cannot delete meal: ID missing.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await deleteMeal(pageData.id); // Use ID from pageData
      if (result.success) {
        toast({ title: "Success", description: "Meal deleted successfully" });
        router.push("/meals");
      } else {
        toast({
          title: "Error",
          description: result.error || "Delete failed",
          variant: "destructive",
        });
        setIsSubmitting(false);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred";
      toast({ title: "Error", description: message, variant: "destructive" });
      setIsSubmitting(false);
    }
  }, [pageData?.id, router, toast]); // Depend on pageData.id
  // --- End Event Handlers ---

  // Handle case where pageData might initially be null/undefined from server
  if (!pageData) {
    // Or return a more specific loading/error state
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        Loading meal data...
      </div>
    );
  }

  return (
    <div>
      {/* Header Buttons */}
      <div className="flex justify-between items-center mb-6">
        <BackButton />
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <MealEditForm
              availableIngredients={ingredientList}
              isLoadingIngredients={false}
            />
            {/* MealEditForm uses form context */}
          </form>
        </Form>
      ) : (
        // Pass the necessary data derived from pageData
        <MealDisplayDetails
          meal={pageData} // Pass the whole meal object from pageData
          mealIngredientsData={pageData.mealIngredients} // Pass the ingredients array
          authorName={authorName} // Pass the placeholder
        />
      )}
      {/* --- End Conditional Rendering --- */}
    </div>
  );
}
