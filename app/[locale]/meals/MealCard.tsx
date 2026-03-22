import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import {
  ChefHat,
  Clock,
  Flame,
  Heart,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { DATE_FORMAT_DISPLAY_CARD } from "@/features/meal-planner/utils";
import { useDateLocale } from "@/hooks/use-date-locale";

type MealWithFavourite = Doc<"meals"> & { isFavourited?: boolean };

type Props = {
  meal: MealWithFavourite;
};

export function MealCard({ meal }: Props) {
  const t = useTranslations("mealDetails");
  const tFav = useTranslations("favourites");
  const tMeal = useTranslations("meal");
  const dateLocale = useDateLocale();
  const authorDisplayName = useQuery(api.users.queries.getUserDisplayName, {
    userId: meal.createdBy,
  });
  const isFavouritedFromQuery = useQuery(
    api.favourites.queries.isFavourited,
    "isFavourited" in meal && typeof meal.isFavourited === "boolean"
      ? "skip"
      : { mealId: meal._id },
  );
  const isFavourited =
    typeof meal.isFavourited === "boolean"
      ? meal.isFavourited
      : (isFavouritedFromQuery ?? false);
  const addToFavourites = useMutation(api.favourites.mutations.addToFavourites);
  const removeFromFavourites = useMutation(
    api.favourites.mutations.removeFromFavourites,
  );

  const totalTime = (meal.prepTimeMinutes || 0) + (meal.cookTimeMinutes || 0);
  const displayAuthor = authorDisplayName ?? "Unknown";

  const handleFavouriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFavourited) {
      removeFromFavourites({ mealId: meal._id });
    } else {
      addToFavourites({ mealId: meal._id });
    }
  };

  return (
    <Link href={`/meals/${meal._id}`}>
      <div className="flex h-full flex-col overflow-hidden rounded-lg bg-neutral-200 shadow-md transition-shadow hover:shadow-lg dark:bg-neutral-700">
        <div className="relative h-48 w-full shrink-0 bg-neutral-300 dark:bg-neutral-600">
          {meal.imageUrl ? (
            <Image
              src={meal.imageUrl}
              alt={meal.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <UtensilsCrossed className="h-12 w-12 text-neutral-500 dark:text-neutral-400" />
            </div>
          )}
          {meal.category && (
            <span className="absolute top-2 right-2 rounded-full bg-blue-600 px-2 py-1 text-white text-xs uppercase shadow-sm">
              {tMeal(meal.category)}
            </span>
          )}
          <button
            type="button"
            onClick={handleFavouriteClick}
            className="absolute top-2 left-2 rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition-transform duration-200 ease-out hover:scale-105 hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white active:scale-[0.98]"
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
          >
            <Heart
              className={`h-5 w-5 transition-all duration-300 ease-out ${isFavourited ? "scale-[1.05] animate-[heart-pop_0.35s_ease-out] fill-white" : "scale-100"}`}
            />
          </button>
        </div>

        <div className="flex grow flex-col p-4 text-neutral-700 dark:text-neutral-300">
          <h2 className="mb-2 line-clamp-1 font-semibold text-xl">
            {meal.name}
          </h2>
          <p className="mb-4 line-clamp-2 grow text-sm">
            {meal.description || t("noDescription")}
          </p>

          <div className="mb-3 flex items-center gap-4 text-neutral-600 text-sm dark:text-neutral-400">
            <span className="flex items-center" title={t("totalTimeTitle")}>
              <Clock className="mr-1 h-4 w-4 shrink-0" />
              {totalTime > 0 ? `${totalTime} min` : t("notApplicable")}
            </span>

            {meal.servings && (
              <span className="flex items-center" title={t("servingsTitle")}>
                <Users className="mr-1 h-4 w-4 shrink-0" />
                {t("servings", { count: meal.servings })}
              </span>
            )}

            {meal.calories && (
              <span className="flex items-center" title={t("caloriesTitle")}>
                <Flame className="mr-1 h-4 w-4 shrink-0" />
                {t("calories", { count: meal.calories })}
              </span>
            )}
          </div>

          <div className="mt-auto flex items-center justify-between border-neutral-300 border-t pt-2 dark:border-neutral-600">
            <div
              className="flex items-center text-neutral-600 text-sm dark:text-neutral-400"
              title={t("authorTitle")}
            >
              <ChefHat className="mr-1 h-4 w-4 shrink-0" />
              <span className="truncate">
                {t("author", { name: displayAuthor })}
              </span>
            </div>

            <span className="shrink-0 text-neutral-500 text-xs first-letter:uppercase dark:text-neutral-400">
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
