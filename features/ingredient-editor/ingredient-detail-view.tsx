"use client";

import { type Preloaded, usePreloadedQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { Edit, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BackButton } from "@/components/back-button";
import { Button } from "@/components/ui/button";
import type { api } from "@/convex/_generated/api";
import { IngredientEditForm } from "./ingredient-edit-form";
import { IngredientDisplayDetails } from "./ingredient-display-details";

interface IngredientDetailViewProps {
  preloadedIngredient: Preloaded<
    typeof api.ingredients.queries.getIngredient
  >;
}

export default function IngredientDetailView({
  preloadedIngredient,
}: IngredientDetailViewProps) {
  const ingredient = usePreloadedQuery(preloadedIngredient);
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const t = useTranslations("ingredientEditor");
  const tMeal = useTranslations("mealEditor");

  const toggleEditMode = () => setIsEditing((prev) => !prev);

  if (!ingredient) {
    router.replace("/ingredients");
    return <div>Ingredient not found</div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <BackButton destination="/ingredients" />

        {isEditing ? (
          <Button variant="outline" onClick={toggleEditMode}>
            <X className="mr-1 h-4 w-4" /> {tMeal("cancel")}
          </Button>
        ) : (
          <Button variant="outline" onClick={toggleEditMode}>
            <Edit className="mr-1 h-4 w-4" /> {t("editIngredient")}
          </Button>
        )}
      </div>

      {isEditing ? (
        <IngredientEditForm
          ingredient={ingredient}
          onSuccess={() => setIsEditing(false)}
        />
      ) : (
        <IngredientDisplayDetails ingredient={ingredient} />
      )}
    </div>
  );
}
