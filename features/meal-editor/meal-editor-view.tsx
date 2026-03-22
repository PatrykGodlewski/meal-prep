"use client";

import {
  type Preloaded,
  useMutation,
  usePreloadedQuery,
  useQuery,
} from "convex/react";
import { Edit, Heart, HelpCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { BackButton } from "@/components/back-button";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/convex/_generated/api";
import { MealDisplayDetails } from "@/features/meal-editor/meal-display-details";
import { MealEditForm } from "@/features/meal-editor/meal-editor-form";

interface MealDetailViewProps {
  preloadedMeal: Preloaded<typeof api.meals.queries.getMeal>;
  preloadedIngredients: Preloaded<
    typeof api.ingredients.queries.getIngredients
  >;
}

export default function MealDetailView({
  preloadedMeal,
  preloadedIngredients,
}: MealDetailViewProps) {
  const meal = usePreloadedQuery(preloadedMeal);
  const ingredientList = usePreloadedQuery(preloadedIngredients);
  const router = useRouter();
  const tFav = useTranslations("favourites");
  const isFavourited = useQuery(
    api.favourites.queries.isFavourited,
    meal ? { mealId: meal._id } : "skip",
  );
  const addToFavourites = useMutation(api.favourites.mutations.addToFavourites);
  const removeFromFavourites = useMutation(
    api.favourites.mutations.removeFromFavourites,
  );

  const [isEditing, setIsEditing] = useState(false);

  const toggleEditMode = () => {
    setIsEditing((prev) => !prev);
  };

  useEffect(() => {
    if (!meal) {
      router.replace("/meals");
    }
  });

  if (!meal) {
    return <div> Meal not found </div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <BackButton destination="/meals" />

        {isEditing ? (
          <Button variant="outline" onClick={toggleEditMode}>
            <X className="mr-1 h-4 w-4" /> Cancel
          </Button>
        ) : (
          <div className="flex gap-2">
            <ServingsTooltip />
            <Button
              variant="outline"
              onClick={() =>
                isFavourited
                  ? removeFromFavourites({ mealId: meal._id })
                  : addToFavourites({ mealId: meal._id })
              }
              title={
                isFavourited
                  ? tFav("removeFromFavourites")
                  : tFav("addToFavourites")
              }
              aria-label={
                isFavourited
                  ? tFav("removeFromFavourites")
                  : tFav("addToFavourites")
              }
              className="transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Heart
                className={`mr-1 h-4 w-4 transition-all duration-300 ease-out ${isFavourited ? "scale-[1.05] fill-red-500" : "scale-100"}`}
              />
              {isFavourited
                ? tFav("removeFromFavourites")
                : tFav("addToFavourites")}
            </Button>
            <Button variant="outline" onClick={toggleEditMode}>
              <Edit className="mr-1 h-4 w-4" /> Edit Meal
            </Button>
          </div>
        )}
      </div>

      {isEditing ? (
        <MealEditForm
          meal={meal}
          availableIngredients={ingredientList}
          onSuccess={() => setIsEditing(false)}
        />
      ) : (
        <MealDisplayDetails
          meal={meal}
          mealIngredients={meal?.mealIngredients}
        />
      )}
    </div>
  );
}

export function ServingsTooltip() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost">
            <HelpCircle />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-md text-md">
            Serving is a global setting that multiplies base values of meal.
            Meals should be composed in a way that all instructions are for most
            optimal meal preparation. Batch cooking or joining the factors of a
            meal in to other meal
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
