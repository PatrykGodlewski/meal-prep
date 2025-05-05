import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation } from "@tanstack/react-query";
import type { FunctionReturnType } from "convex/server";
import { toast } from "sonner";

export function useMealEditor({
  onSuccess,
}: {
  onSuccess?: (id?: Id<"meals">) => void;
}) {
  const { mutate: deleteMeal, isPending: isPendingDelete } = useMutation({
    mutationFn: useConvexMutation(api.meals.mutations.deleteMeal),
    onSuccess: () => {
      toast("Success", {
        description: "Meal added successfully",
      });
      onSuccess?.();
    },
    onError: (error) => {
      console.error(error);
      toast("Error", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred.",
      });
    },
  });

  const { mutate: editMeal, isPending: isPendingEdit } = useMutation({
    mutationFn: useConvexMutation(api.meals.mutations.editMeal),
    onSuccess: () => {
      toast("Success", {
        description: "Meal edited successfully",
      });
      onSuccess?.();
    },
    onError: (error) => {
      console.error(error);
      toast("Error", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred.",
      });
    },
  });

  const { mutate: addMeal, isPending: isPendingAdd } = useMutation({
    mutationFn: useConvexMutation(api.meals.mutations.addMeal),
    onSuccess: (
      response: FunctionReturnType<typeof api.meals.mutations.addMeal>,
    ) => {
      toast("Success", {
        description: "Meal added successfully",
      });
      onSuccess?.(response.mealId);
    },
    onError: (error) => {
      console.error(error);
      toast("Error", {
        description:
          error instanceof Error ? error.message : "An unknown error occurred.",
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
