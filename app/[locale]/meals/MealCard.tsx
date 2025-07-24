import type { Doc } from "@/convex/_generated/dataModel";
import { DATE_FORMAT_DISPLAY_CARD } from "@/features/meal-planner/utils";
import { useDateLocale } from "@/hooks/use-date-locale";
import { format } from "date-fns";
import {
  ChefHat,
  Clock,
  Flame,
  Users,
  UtensilsCrossed,
  Weight,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";

type Props = {
  meal: Doc<"meals">;
};

export function MealCard({ meal }: Props) {
  const t = useTranslations("mealDetails");
  const tMeal = useTranslations("meal");
  const dateLocale = useDateLocale();

  const totalTime = (meal.prepTimeMinutes || 0) + (meal.cookTimeMinutes || 0);

  const displayAuthor = meal.createdBy || "Skibidi Obiadex";

  return (
    <Link href={`/meals/${meal._id}`}>
      <div className="bg-neutral-200 dark:bg-neutral-700 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow h-full flex flex-col">
        <div className="relative h-48 w-full bg-neutral-300 dark:bg-neutral-600 shrink-0">
          {meal.imageUrl ? (
            <Image
              src={meal.imageUrl}
              alt={meal.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // Add sizes prop for optimization
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <UtensilsCrossed className="h-12 w-12 text-neutral-500 dark:text-neutral-400" />
            </div>
          )}
          {meal.category && (
            <span className="absolute uppercase top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full shadow-sm">
              {tMeal(meal.category)}
            </span>
          )}
        </div>

        <div className="p-4 text-neutral-700 dark:text-neutral-300 flex flex-col grow">
          <h2 className="text-xl font-semibold mb-2 line-clamp-1">
            {meal.name}
          </h2>
          <p className="text-sm mb-4 line-clamp-2 grow">
            {meal.description || t("noDescription")}
          </p>

          <div className="flex items-center text-sm mb-3 gap-4 text-neutral-600 dark:text-neutral-400">
            <span className="flex items-center" title={t("totalTimeTitle")}>
              <Clock className="h-4 w-4 mr-1 shrink-0" />
              {totalTime > 0 ? `${totalTime} min` : t("notApplicable")}
            </span>

            {meal.servings && (
              <span className="flex items-center" title={t("servingsTitle")}>
                <Users className="h-4 w-4 mr-1 shrink-0" />
                {t("servings", { count: meal.servings })}
              </span>
            )}

            {meal.calories && (
              <span className="flex items-center" title={t("caloriesTitle")}>
                <Flame className="h-4 w-4 mr-1 shrink-0" />
                {t("calories", { count: meal.calories })}
              </span>
            )}
          </div>

          <div className="flex justify-between items-center mt-auto pt-2 border-t border-neutral-300 dark:border-neutral-600">
            <div
              className="flex items-center text-sm text-neutral-600 dark:text-neutral-400"
              title={t("authorTitle")}
            >
              <ChefHat className="h-4 w-4 mr-1 shrink-0" />
              <span className="truncate">{t("author", { name: displayAuthor })}</span>
            </div>

            <span className="first-letter:uppercase text-xs text-neutral-500 dark:text-neutral-400 shrink-0">
              {format(meal.createdAt, DATE_FORMAT_DISPLAY_CARD, {
                locale: dateLocale,
              })}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
