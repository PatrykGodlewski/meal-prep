import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { toast } from "@/hooks/use-toast";
import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation } from "@tanstack/react-query";
import type { FunctionReturnType } from "convex/server";

export function useMealEditor({
  onSuccess,
}: {
  onSuccess?: (id?: Id<"meals">) => void;
}) {
  const { mutate: deleteMeal, isPending: isPendingDelete } = useMutation({
    mutationFn: useConvexMutation(api.meals.deleteMeal),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Meal added successfully",
      });
      onSuccess?.();
    },
    onError: (error) => {
      console.error(error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    },
  });

  const { mutate: editMeal, isPending: isPendingEdit } = useMutation({
    mutationFn: useConvexMutation(api.meals.editMeal),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Meal edited successfully",
      });
      onSuccess?.();
    },
    onError: (error) => {
      console.error(error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    },
  });

  const { mutate: addMeal, isPending: isPendingAdd } = useMutation({
    mutationFn: useConvexMutation(api.meals.addMeal),
    onSuccess: (response: FunctionReturnType<typeof api.meals.addMeal>) => {
      toast({
        title: "Success",
        description: "Meal added successfully",
      });
      onSuccess?.(response.mealId);
    },
    onError: (error) => {
      console.error(error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    },
  });

  return {
    editMeal,
    deleteMeal,
    addMeal,
    isPending: isPendingEdit || isPendingDelete || isPendingAdd,
  };
}
